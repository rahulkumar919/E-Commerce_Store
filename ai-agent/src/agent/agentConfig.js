/**
 * agentConfig.js — Agent hard limits & cost controls
 * ────────────────────────────────────────────────────
 * All tunable constants live here — agent.js reads this, never hardcodes.
 *
 * WHY SEPARATE:
 * Having these in one place makes it trivial to tune without hunting through
 * agent orchestration logic — and easy to explain in an interview ("the agent's
 * guard-rails are centralized in agentConfig.js").
 */

"use strict";

const agentConfig = {
  // Maximum number of tool-call iterations per user message.
  // Prevents runaway chains from burning tokens.
  // 6 is enough for: searchProducts → getProduct → addToCart → getCart
  maxIterations: parseInt(process.env.AGENT_MAX_ITERATIONS || "6", 10),

  // Wall-clock timeout for the entire agent turn (ms).
  // If the agent hasn't responded in 25s, we abort and return a safe error.
  requestTimeoutMs: parseInt(process.env.AGENT_TIMEOUT_MS || "25000", 10),

  // Maximum tokens the LLM may produce in a single response.
  // Keeps costs predictable; overrides the provider default if set.
  maxOutputTokens: parseInt(process.env.GEMINI_MAX_TOKENS || "1024", 10),

  // How many recent conversation turns to keep in the context window.
  // Each "turn" = 1 user message + 1 assistant message.
  // Beyond this, older turns are summarised (handled in conversationMemory.js).
  maxHistoryTurns: parseInt(process.env.AGENT_MAX_HISTORY_TURNS || "10", 10),

  // Maximum characters in a user message (defence against huge payloads).
  maxUserMessageLength: 2000,
};

module.exports = agentConfig;
