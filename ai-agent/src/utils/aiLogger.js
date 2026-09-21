/**
 * aiLogger.js
 * ───────────
 * Structured logger for the AI layer.
 *
 * WHY: We need consistent, searchable logs for latency, tool calls, RAG usage,
 * and errors — without accidentally leaking API keys, JWTs, or PII.
 *
 * WHAT IT NEVER LOGS:
 *  - req.cookies, req.headers.authorization
 *  - API keys (Gemini, Pinecone, etc.)
 *  - Full user message content (truncated to 120 chars)
 *  - Passwords, tokens, credit-card data
 */

"use strict";

const TRUNCATE_AT = 120;

function now() {
  return new Date().toISOString();
}

/**
 * Truncate a string for safe logging.
 * @param {string} str
 * @param {number} max
 */
function trunc(str, max = TRUNCATE_AT) {
  if (typeof str !== "string") return str;
  return str.length > max ? str.slice(0, max) + "…" : str;
}

/**
 * Log a structured AI event.
 *
 * @param {"info"|"warn"|"error"} level
 * @param {string} event     - machine-readable event name e.g. "agent.start"
 * @param {object} data      - safe fields to include
 */
function log(level, event, data = {}) {
  const entry = {
    ts:    now(),
    level,
    event,
    ...data,
    // Truncate any message field so full user prompts don't appear in logs
    ...(data.message    && { message:    trunc(data.message) }),
    ...(data.text       && { text:       trunc(data.text) }),
    ...(data.query      && { query:      trunc(data.query) }),
    ...(data.toolInput  && { toolInput:  trunc(JSON.stringify(data.toolInput)) }),
    ...(data.toolOutput && { toolOutput: trunc(JSON.stringify(data.toolOutput)) }),
  };

  // eslint-disable-next-line no-console
  console[level === "error" ? "error" : "log"](JSON.stringify(entry));
}

const aiLogger = {
  info:  (event, data) => log("info",  event, data),
  warn:  (event, data) => log("warn",  event, data),
  error: (event, data) => log("error", event, data),

  /** Convenience: log the start of an agent turn */
  agentStart: (requestId, userId, message) =>
    log("info", "agent.start", { requestId, userId, message }),

  /** Convenience: log a tool call */
  toolCall: (requestId, toolName, input, durationMs, success) =>
    log("info", "tool.call", { requestId, toolName, toolInput: input, durationMs, success }),

  /** Convenience: log RAG retrieval */
  ragRetrieve: (requestId, query, docsFound, durationMs) =>
    log("info", "rag.retrieve", { requestId, query, docsFound, durationMs }),

  /** Convenience: log the end of an agent turn */
  agentEnd: (requestId, durationMs, toolsUsed, usedRag) =>
    log("info", "agent.end", { requestId, durationMs, toolsUsed, usedRag }),
};

module.exports = aiLogger;
