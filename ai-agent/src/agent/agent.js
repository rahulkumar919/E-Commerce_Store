/**
 * agent.js — Full Agentic ReAct loop (Phase 6 — all tools + RAG active)
 * ─────────────────────────────────────────────────────────────────────
 * ARCHITECTURE:
 *   ai.controller.js → runAgent() → LLM.bindTools([...]) → tool calls → services → MongoDB
 *
 * HOW THE ReAct LOOP WORKS:
 *   1. Build messages: [SystemMessage, ...history, HumanMessage(userInput)]
 *   2. Invoke LLM with tools bound → model may return tool_call messages
 *   3. If tool calls present: execute them → append results → invoke LLM again
 *   4. Repeat until LLM returns a plain text response (no more tool calls)
 *   5. Hard stop at agentConfig.maxIterations to prevent infinite loops
 *
 * WHAT THIS FILE DOES NOT DO:
 *   - Never constructs a specific LLM (getLLM() handles that)
 *   - Never touches req/res (ai.controller.js handles that)
 *   - Never accesses userId from user messages (ctx.userId is the only source)
 *
 * STRUCTURED RESPONSE:
 *   Returns: { message, products[], cart, order, citations[], toolsUsed[], usedRag }
 *   The controller uses this to build the JSON response the frontend expects.
 *
 * TOOL RESULT PARSING:
 *   Each tool returns JSON.stringify(result). We parse the relevant fields out
 *   here to build the structured response (products, cart, etc.).
 */

"use strict";

const { HumanMessage, SystemMessage, AIMessage: LCAIMessage, ToolMessage } = require("@langchain/core/messages");
const { getLLM }               = require("../llm");
const { SYSTEM_PROMPT }        = require("./agentPrompt");
const agentConfig              = require("./agentConfig");
const aiLogger                 = require("../utils/aiLogger");
const { sanitizeString }       = require("../utils/sanitize");

// ── Tool factories — each takes ctx so tools always have the authenticated userId ─
const { createSearchProductsTool }    = require("../tools/searchProducts.tool");
const { createGetProductTool }        = require("../tools/getProduct.tool");
const { createGetCartTool }           = require("../tools/getCart.tool");
const { createAddToCartTool }         = require("../tools/addToCart.tool");
const { createRemoveFromCartTool }    = require("../tools/removeFromCart.tool");
const { createUpdateCartQuantityTool }= require("../tools/updateCartQuantity.tool");
const { createGetOrderStatusTool }    = require("../tools/getOrderStatus.tool");
const { createSearchKnowledgeTool }   = require("../tools/searchKnowledge.tool");

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * buildMessages — Construct the LangChain message array for this turn.
 * @param {string}   userMessage
 * @param {object[]} history   [{ role:"user"|"assistant", content }]
 */
function buildMessages(userMessage, history) {
  const msgs = [new SystemMessage(SYSTEM_PROMPT)];

  for (const turn of history) {
    msgs.push(
      turn.role === "user"
        ? new HumanMessage(turn.content)
        : new LCAIMessage(turn.content)
    );
  }

  msgs.push(new HumanMessage(sanitizeString(userMessage)));
  return msgs;
}

/**
 * buildTools — Instantiate all tools with the per-request context.
 * ctx.userId is injected here so every tool has it without asking the LLM.
 */
function buildTools(ctx) {
  return [
    createSearchProductsTool(ctx),
    createGetProductTool(ctx),
    createGetCartTool(ctx),
    createAddToCartTool(ctx),
    createRemoveFromCartTool(ctx),
    createUpdateCartQuantityTool(ctx),
    createGetOrderStatusTool(ctx),
    createSearchKnowledgeTool(ctx),
  ];
}

/**
 * parseToolResult — Safely parse a tool's JSON string output.
 */
function parseToolResult(content) {
  if (typeof content !== "string") return {};
  try { return JSON.parse(content); } catch { return {}; }
}

/**
 * extractStructuredData — Walk tool results to build the structured response fields.
 * This means the controller gets real product/cart objects, not embedded JSON strings.
 */
function extractStructuredData(toolCallLog) {
  let products   = [];
  let cart       = null;
  let order      = null;
  let citations  = [];
  let usedRag    = false;
  const toolsUsed = [...new Set(toolCallLog.map((t) => t.name))];

  for (const { name, result } of toolCallLog) {
    if (!result?.success) continue;

    if (name === "searchProducts" && result.products?.length) {
      products = result.products;
    }
    if (name === "getProduct" && result.product) {
      products = [result.product];
    }
    if (name === "getCart") {
      cart = { items: result.items || [], total: result.total || 0 };
    }
    if (name === "addToCart") {
      if (result.product) {
        products = [result.product];
      }
      if (result.cartItem) {
        cart = {
          items: [{
            product: result.product || { id: result.cartItem.productId },
            quantity: result.cartItem.quantity || 1,
          }],
          itemCount: result.cartItem.quantity || 1,
        };
      }
    }
    if (name === "getOrderStatus") {
      order = result.order || (result.orders ? { orders: result.orders } : null);
    }
    if (name === "searchKnowledge" && result.citations?.length) {
      citations = result.citations;
      usedRag   = true;
    }
  }

  return { products, cart, order, citations, toolsUsed, usedRag };
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * runAgent — Execute one agent turn with full tool-calling loop.
 *
 * @param {string}   userMessage   Current user input (already sanitised by controller)
 * @param {object[]} history       Bounded history from conversationMemory
 * @param {object}   ctx           { userId, conversationId, requestId }
 *
 * @returns {Promise<AgentResult>}
 */
async function runAgent(userMessage, history = [], ctx = {}) {
  const { requestId = "unknown", userId } = ctx;
  const startMs = Date.now();

  // ── Validate ───────────────────────────────────────────────────────────────
  if (!userMessage?.trim()) throw new Error("userMessage must be a non-empty string");
  if (userMessage.length > agentConfig.maxUserMessageLength) {
    throw new Error(`Message too long (max ${agentConfig.maxUserMessageLength} chars)`);
  }

  aiLogger.agentStart(requestId, userId, userMessage);

  // ── Setup ──────────────────────────────────────────────────────────────────
  const llm      = getLLM();
  const tools    = buildTools(ctx);
  const llmWithTools = llm.bindTools(tools);

  // Build a tool map for fast lookup during execution
  const toolMap  = Object.fromEntries(tools.map((t) => [t.name, t]));

  let messages   = buildMessages(userMessage, history);
  let iterations = 0;
  const toolCallLog = []; // { name, input, result }

  // ── ReAct loop ─────────────────────────────────────────────────────────────
  while (iterations < agentConfig.maxIterations) {
    iterations++;

    // Invoke LLM with timeout guard
    let response;
    try {
      response = await Promise.race([
        llmWithTools.invoke(messages),
        new Promise((_, reject) =>
          setTimeout(
            () => reject(new Error("Agent request timed out")),
            agentConfig.requestTimeoutMs
          )
        ),
      ]);
    } catch (err) {
      aiLogger.error("agent.llm_invoke_error", { requestId, iteration: iterations, error: err.message });
      throw err;
    }

    // If the model returned no tool calls → it's the final answer, exit loop
    if (!response.tool_calls || response.tool_calls.length === 0) {
      messages.push(response);
      break;
    }

    // ── Execute tool calls ───────────────────────────────────────────────────
    messages.push(response); // Append AI message with tool_call requests

    for (const toolCall of response.tool_calls) {
      const tool = toolMap[toolCall.name];

      if (!tool) {
        aiLogger.warn("agent.unknown_tool", { requestId, toolName: toolCall.name });
        messages.push(
          new ToolMessage({
            content:      JSON.stringify({ success: false, message: `Unknown tool: ${toolCall.name}` }),
            tool_call_id: toolCall.id,
            name:         toolCall.name,
          })
        );
        continue;
      }

      // Execute the tool — result is always a JSON string
      let toolResult;
      try {
        toolResult = await tool.invoke(toolCall.args || {});
      } catch (err) {
        aiLogger.error("agent.tool_exec_error", { requestId, toolName: toolCall.name, error: err.message });
        toolResult = JSON.stringify({ success: false, message: "Tool execution failed" });
      }

      const parsed = parseToolResult(toolResult);
      toolCallLog.push({ name: toolCall.name, input: toolCall.args, result: parsed });

      messages.push(
        new ToolMessage({
          content:      toolResult,
          tool_call_id: toolCall.id,
          name:         toolCall.name,
        })
      );
    }
    // Loop continues → model sees tool results and decides whether to call more tools or respond
  }

  // Extract final text — LangChain may return content as string OR as an array of parts
  const lastMessage  = messages[messages.length - 1];
  let responseText = "";
  if (typeof lastMessage?.content === "string") {
    responseText = lastMessage.content;
  } else if (Array.isArray(lastMessage?.content)) {
    // Gemini sometimes returns [{type:"text", text:"..."}]
    responseText = lastMessage.content
      .filter((p) => p?.type === "text" || typeof p === "string")
      .map((p)  => (typeof p === "string" ? p : p.text))
      .join("");
  }
  if (!responseText) {
    responseText = "I'm sorry, I wasn't able to generate a response. Please try again.";
  }

  const { products, cart, order, citations, toolsUsed, usedRag } =
    extractStructuredData(toolCallLog);

  const durationMs = Date.now() - startMs;
  aiLogger.agentEnd(requestId, durationMs, toolsUsed, usedRag);

  return {
    message:   responseText,
    products,
    cart,
    order,
    citations,
    toolsUsed,
    usedRag,
  };
}

module.exports = { runAgent };
