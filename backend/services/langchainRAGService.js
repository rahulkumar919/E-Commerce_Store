/**
 * LangChain RAG Service — STM Fruit Shop
 *
 * Full flow:
 *  1. User query arrives
 *  2. Rewrite query for follow-up questions (Gemini 2.0 Flash)
 *  3. Search Pinecone using integrated embedding (llama-text-embed-v2)
 *     → pass plain text query, Pinecone embeds internally
 *  4. Build context string from top matches
 *  5. Feed (context + query) to Gemini 2.0 Flash LLM
 *  6. Maintain conversational history per session
 *  7. Return answer + relevant products from MongoDB
 */

require("dotenv").config();

const { Pinecone } = require("@pinecone-database/pinecone");
const { GoogleGenAI } = require("@google/genai");

// ── Validate Environment Variables ────────────────────────────────────────────
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing from .env file");
}
if (!process.env.PINECONE_API_KEY) {
  console.error("❌ PINECONE_API_KEY is missing from .env file");
}

// ── Singletons ────────────────────────────────────────────────────────────────

let pineconeIndex = null;
let geminiClient = null;

async function getPineconeIndex() {
  if (!pineconeIndex) {
    try {
      const pineconeKey =
        process.env.PINECONE_API_KEY && process.env.PINECONE_API_KEY.trim();
      if (!pineconeKey) throw new Error("PINECONE_API_KEY is missing");
      const client = new Pinecone({ apiKey: pineconeKey });
      pineconeIndex = client.Index(
        (process.env.PINECONE_INDEX_NAME || "").trim(),
      );
      console.log(
        "🌲 Pinecone index connected:",
        process.env.PINECONE_INDEX_NAME,
      );
    } catch (err) {
      console.error("❌ Pinecone connection failed:", err.message);
      throw new Error("Pinecone connection failed: " + err.message);
    }
  }
  return pineconeIndex;
}

function getGeminiClient() {
  if (!geminiClient) {
    try {
      const geminiKey =
        process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim();
      if (!geminiKey) throw new Error("GEMINI_API_KEY is missing");
      geminiClient = new GoogleGenAI({ apiKey: geminiKey });
      console.log("✅ Gemini AI client initialized");
    } catch (err) {
      console.error("❌ Gemini client initialization failed:", err.message);
      throw new Error("Gemini initialization failed: " + err.message);
    }
  }
  return geminiClient;
}

// ── Per-session conversation history ─────────────────────────────────────────
const sessionHistories = new Map();

function getHistory(sessionId = "default") {
  if (!sessionHistories.has(sessionId)) sessionHistories.set(sessionId, []);
  return sessionHistories.get(sessionId);
}

function clearHistory(sessionId = "default") {
  sessionHistories.set(sessionId, []);
}

// ── Step 1: Rewrite follow-up query into standalone question ──────────────────
async function rewriteQuery(question, sessionId) {
  const history = getHistory(sessionId);
  if (history.length === 0) return question; // already standalone

  try {
    history.push({ role: "user", parts: [{ text: question }] });

    const res = await getGeminiClient().models.generateContent({
      model: "gemini-2.0-flash",
      contents: history,
      config: {
        systemInstruction: `You are a query rewriting expert.
Based on the chat history, rephrase the latest user question into a
complete, standalone question that can be understood without the history.
Output ONLY the rewritten question — nothing else.`,
      },
    });

    history.pop();
    const rewritten = res.text?.trim();
    if (rewritten) {
      console.log(`🔄 Rewritten: "${question}" → "${rewritten}"`);
      return rewritten;
    }
    return question;
  } catch (err) {
    history.pop();
    console.warn("⚠️  Query rewrite skipped:", err.message);
    return question;
  }
}

// ── Step 2: Search Pinecone with integrated embedding ─────────────────────────
// The index uses llama-text-embed-v2 (integrated).
// We call searchRecords(query) — Pinecone converts the text to a vector internally.
async function retrieveContext(question, topK = 10) {
  try {
    console.log("🔍 Searching Pinecone (integrated embedding)...");
    const index = await getPineconeIndex();

    const results = await index.searchRecords({
      query: {
        inputs: { text: question },
        topK,
      },
      fields: ["text", "source", "page"],
    });

    const matches = results.result?.hits || [];
    console.log(`   ✅ Found ${matches.length} relevant chunks`);

    const context = matches
      .filter((m) => m.fields?.text)
      .map((m) => m.fields.text)
      .join("\n\n---\n\n");

    return { context, matches };
  } catch (err) {
    console.error("❌ Pinecone search error:", err.message);
    return { context: "", matches: [] };
  }
}

// ── Step 3: Ask Gemini LLM with RAG context ───────────────────────────────────
async function askLLM(question, context, sessionId) {
  const history = getHistory(sessionId);

  const systemInstruction = `You are a friendly, knowledgeable AI assistant for STM Fruit Shop
in Sitamarhi, Bihar, India.

The shop sells: fresh fruits, dry fruits, birthday cakes, birthday decorations, and fresh juices.

CONTEXT from our knowledge base:
${context || "No specific context found. Answer from general knowledge about the shop."}

RULES:
- Answer in warm, conversational Hinglish (Hindi + English mix)
- Be concise — 3–5 sentences maximum
- Use 1–2 relevant emojis
- Base answers on the CONTEXT provided above
- For greetings, respond warmly without product suggestions
  - For delivery / order queries: same-day delivery in Sitamarhi, WhatsApp: +91 9142517255
- If answer is not in context, give a helpful general response about the shop
- Do NOT make up prices or products not mentioned in context`;

  try {
    history.push({ role: "user", parts: [{ text: question }] });

    const res = await getGeminiClient().models.generateContent({
      model: "gemini-2.0-flash",
      contents: history,
      config: { systemInstruction },
    });

    const answer =
      res.text?.trim() || "Sorry, I could not generate a response right now.";
    history.push({ role: "model", parts: [{ text: answer }] });

    // Keep last 20 turns (10 exchanges)
    if (history.length > 20) history.splice(0, history.length - 20);

    return answer;
  } catch (err) {
    if (history.length > 0 && history[history.length - 1].role === "user")
      history.pop();
    console.error("❌ Gemini LLM error:", err.message);
    throw err;
  }
}

// ── Step 4: Fetch related products from MongoDB ────────────────────────────────
async function fetchRelatedProducts(query, ProductModel) {
  if (!ProductModel) return [];
  try {
    const terms = query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3);

    let products = [];
    if (terms.length > 0) {
      const regex = terms.join("|");
      products = await ProductModel.find({
        $or: [
          { productName: { $regex: regex, $options: "i" } },
          { category: { $regex: regex, $options: "i" } },
          { description: { $regex: regex, $options: "i" } },
        ],
      })
        .limit(4)
        .lean();
    }

    if (products.length === 0) {
      products = await ProductModel.find({})
        .sort({ viewCount: -1 })
        .limit(4)
        .lean();
    }

    return products.map((p) => ({
      _id: p._id,
      name: p.productName,
      price: p.sellingPrice,
      image: p.productImage?.[0] || "",
      category: p.category,
    }));
  } catch (err) {
    console.error("⚠️  Product fetch error:", err.message);
    return [];
  }
}

// ── Main pipeline ──────────────────────────────────────────────────────────────
async function ragChat({ query, sessionId = "default", ProductModel }) {
  console.log("\n" + "═".repeat(55));
  console.log("🤖 RAG CHAT  —  STM Fruit Shop");
  console.log("═".repeat(55));
  console.log("📝 Query    :", query);
  console.log("🔑 Session  :", sessionId);

  // 1. Rewrite follow-up queries
  const standaloneQuery = await rewriteQuery(query, sessionId);

  // 2. Retrieve context from Pinecone
  const { context, matches } = await retrieveContext(standaloneQuery);

  // 3. Generate answer with Gemini
  const answer = await askLLM(standaloneQuery, context, sessionId);
  console.log("💬 Answer   :", answer.substring(0, 100), "...");

  // 4. Related products
  const products = await fetchRelatedProducts(standaloneQuery, ProductModel);
  console.log(`🛍️  Products : ${products.length}`);
  console.log("═".repeat(55) + "\n");

  return {
    success: true,
    message: answer,
    recommendedProducts: products,
    contextUsed: matches.length > 0,
    sessionId,
  };
}

module.exports = { ragChat, clearHistory };
