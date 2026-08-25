/**
 * Voice Agent Service — STM Fruit Shop
 *
 * Full pipeline:
 *  1. Receive text (already STT-converted)
 *  2. Search Pinecone RAG for knowledge context
 *  3. Call Gemini with system prompt + RAG context + conversation history
 *  4. Parse tool calls from Gemini response
 *  5. Execute tools (MongoDB queries)
 *  6. Feed tool results back to Gemini for final natural language response
 *  7. Return final text → caller converts to speech via ElevenLabs
 */

const { GoogleGenAI } = require("@google/genai");
const { Pinecone } = require("@pinecone-database/pinecone");
const { TOOL_DEFINITIONS, executeTool } = require("./voiceAgentTools");

// ── Lazy singletons ───────────────────────────────────────────────────────────
let _gemini = null;
let _pineconeIndex = null;

function getGemini() {
  if (!_gemini) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY not set");
    _gemini = new GoogleGenAI({ apiKey: key });
  }
  return _gemini;
}

async function getPinecone() {
  if (!_pineconeIndex) {
    if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX_NAME) {
      return null; // RAG optional
    }
    try {
      const client = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
      _pineconeIndex = client.Index(process.env.PINECONE_INDEX_NAME);
    } catch {
      return null;
    }
  }
  return _pineconeIndex;
}

// ── Per-session conversation memory ──────────────────────────────────────────
// Stored as Gemini "contents" arrays: [{ role: "user"|"model", parts: [{text}] }]
const sessions = new Map(); // sessionId → contents[]

function getHistory(sessionId) {
  if (!sessions.has(sessionId)) sessions.set(sessionId, []);
  return sessions.get(sessionId);
}

function clearSession(sessionId) {
  sessions.delete(sessionId);
}

function pruneHistory(history, maxTurns = 20) {
  if (history.length > maxTurns * 2) {
    history.splice(0, history.length - maxTurns * 2);
  }
}

// ── RAG: retrieve context from Pinecone ──────────────────────────────────────
async function retrieveContext(query) {
  const index = await getPinecone();
  if (!index) return "";

  try {
    const results = await index.searchRecords({
      query: { inputs: { text: query }, topK: 5 },
      fields: ["text"],
    });
    const hits = results.result?.hits || [];
    return hits
      .filter((h) => h.fields?.text)
      .map((h) => h.fields.text)
      .join("\n\n---\n\n");
  } catch {
    return "";
  }
}

// ── System Prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Meena, a warm and helpful AI voice assistant for STM Fruit Shop in Sitamarhi, Bihar, India.

## Shop Info
- Name: STM Fruit Shop
- Location: Sitamarhi, Bihar - 843301
- Phone/WhatsApp: +91 9142517255
- Hours: 8 AM – 9 PM daily
- Delivery: Same-day in 2 hours within Sitamarhi. Free above ₹500.
- Products: Fresh Fruits, Dry Fruits, Fruit Juices, Birthday Cakes, Party Decorations, Gift Hampers

## Conversation Rules
1. You are speaking to a customer over voice — keep responses SHORT (2–3 sentences max)
2. Speak naturally in Hinglish (Hindi + English mix), like a friendly shop assistant
3. NEVER hallucinate prices or products — always use the search_products or check_product_price tools
4. If a customer asks about a specific product, ALWAYS call check_product_price or search_products first
5. If inventory is unavailable, suggest 2 alternatives using search_products
6. Use recommend_for_health for health-related queries
7. If confidence is low or the customer seems frustrated, offer to escalate_to_human
8. For orders, guide them to the website or WhatsApp
9. Avoid long paragraphs — voice responses must be brief and conversational
10. Do NOT use markdown, bullets, or special characters in voice responses

## Tool Usage
Always call the appropriate tool before answering product/price/stock questions.
Return your tool call as JSON in this exact format (nothing else):
{"tool": "tool_name", "params": {...}}

After receiving tool results, generate a natural voice response.`;

// ── Main agent function ───────────────────────────────────────────────────────
async function processVoiceQuery({ text, sessionId = "default", userId }) {
  console.log(`\n🎤 Voice Query | Session: ${sessionId}`);
  console.log(`   Text: "${text}"`);

  const history = getHistory(sessionId);
  pruneHistory(history);

  // 1. Get RAG context
  const ragContext = await retrieveContext(text);
  const contextNote = ragContext
    ? `\n\n## Knowledge Base Context\n${ragContext.slice(0, 1500)}`
    : "";

  const systemWithContext = SYSTEM_PROMPT + contextNote;

  // 2. Determine if tool call is needed (first Gemini pass)
  const firstPassContents = [
    ...history,
    { role: "user", parts: [{ text }] },
  ];

  let toolCallResult = null;
  let toolName = null;
  let toolParams = null;

  try {
    const firstRes = await getGemini().models.generateContent({
      model: "gemini-2.0-flash",
      contents: firstPassContents,
      config: {
        systemInstruction: systemWithContext +
          "\n\nIf this query needs product/price/inventory/offer/health data, respond ONLY with a JSON tool call: {\"tool\": \"tool_name\", \"params\": {...}}. Otherwise respond normally.",
        maxOutputTokens: 200,
        temperature: 0.3,
      },
    });

    const firstText = firstRes.text?.trim() || "";
    console.log(`   First pass: "${firstText.slice(0, 100)}"`);

    // Check if response is a tool call
    if (firstText.startsWith("{") && firstText.includes('"tool"')) {
      try {
        const parsed = JSON.parse(firstText);
        if (parsed.tool && TOOL_DEFINITIONS.find((t) => t.name === parsed.tool)) {
          toolName = parsed.tool;
          toolParams = parsed.params || {};
          toolCallResult = await executeTool(toolName, { ...toolParams, sessionId });
        }
      } catch {
        // Not a valid tool call — treat as direct response
      }
    }

    // If no tool call needed and first pass gave a valid response
    if (!toolName && firstText && firstText.length > 5) {
      // Save to history
      history.push({ role: "user", parts: [{ text }] });
      history.push({ role: "model", parts: [{ text: firstText }] });

      return {
        success: true,
        text: firstText,
        sessionId,
        toolCalled: null,
        toolResult: null,
        ragUsed: !!ragContext,
      };
    }
  } catch (err) {
    console.warn("⚠️  First pass failed:", err.message);
  }

  // 3. Second pass: generate natural response using tool result
  const toolContext = toolCallResult
    ? `\n\nTool "${toolName}" returned: ${JSON.stringify(toolCallResult)}`
    : "";

  const secondPassContents = [
    ...history,
    {
      role: "user",
      parts: [
        {
          text:
            text +
            (toolContext
              ? `\n[System: Use this data to answer: ${toolContext}]`
              : ""),
        },
      ],
    },
  ];

  try {
    const secondRes = await getGemini().models.generateContent({
      model: "gemini-2.0-flash",
      contents: secondPassContents,
      config: {
        systemInstruction:
          systemWithContext +
          "\n\nNow generate a SHORT, friendly voice response (2-3 sentences, Hinglish, no markdown). Use the tool data provided.",
        maxOutputTokens: 300,
        temperature: 0.7,
      },
    });

    const finalText = secondRes.text?.trim() || fallbackResponse(text);

    // Save to history
    history.push({ role: "user", parts: [{ text }] });
    history.push({ role: "model", parts: [{ text: finalText }] });

    return {
      success: true,
      text: finalText,
      sessionId,
      toolCalled: toolName,
      toolResult: toolCallResult,
      ragUsed: !!ragContext,
    };
  } catch (err) {
    console.error("❌ Voice agent error:", err.message);
    const fallback = fallbackResponse(text);
    return {
      success: true,
      text: fallback,
      sessionId,
      toolCalled: toolName,
      toolResult: toolCallResult,
      error: err.message,
    };
  }
}

function fallbackResponse(text) {
  const q = text.toLowerCase();
  if (/price|kitna|cost|rate/.test(q))
    return "Abhi price check kar raha hoon. Please WhatsApp karein +91 9142517255 for exact rates.";
  if (/delivery|deliver/.test(q))
    return "Sitamarhi mein same-day 2 ghante mein delivery available hai. ₹500 se upar FREE delivery!";
  if (/birthday|cake/.test(q))
    return "Birthday cakes aur decorations available hain! WhatsApp karein advance booking ke liye.";
  return "STM Fruit Shop mein aapka swagat hai! Koi bhi sawal puchh sakte hain. WhatsApp: +91 9142517255";
}

module.exports = { processVoiceQuery, clearSession };
