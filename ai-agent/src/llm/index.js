/**
 * ai-agent/src/llm/index.js — LLM provider factory
 * ──────────────────────────────────────────────────
 * The ONLY place in the codebase that knows which LLM provider is active.
 *
 * WHY THIS EXISTS:
 * The agent, tools, and controller never import a specific provider.
 * They call getLLM() and get back a LangChain-compatible chat model.
 * Swapping Gemini → Mistral = change ONE env var (LLM_PROVIDER) + zero code changes.
 *
 * USAGE:
 *   const { getLLM } = require("./ai-agent/src/llm");
 *   const llm = getLLM(); // returns ChatGoogleGenerativeAI or ChatMistralAI
 *
 * SUPPORTED PROVIDERS (LLM_PROVIDER env var):
 *   gemini    — Google Gemini 1.5 Flash (default)
 *   mistral   — Mistral Medium (needs @langchain/mistralai + MISTRAL_API_KEY)
 */

"use strict";

const { createGeminiLLM  } = require("./providers/gemini");
const { createMistralLLM } = require("./providers/mistral");
const { createGroqLLM    } = require("./providers/groq");

// Cache the instance — no need to reconstruct on every request
let cachedLLM = null;

/**
 * getLLM — Returns the active chat LLM instance.
 * First call constructs and caches; subsequent calls return the cached instance.
 *
 * @returns {import("@langchain/core/language_models/chat_models").BaseChatModel}
 */
function getLLM() {
  if (cachedLLM) return cachedLLM;

  const provider = (process.env.LLM_PROVIDER || "gemini").toLowerCase().trim();

  switch (provider) {
    case "gemini":
      cachedLLM = createGeminiLLM();
      break;
    case "groq":
      cachedLLM = createGroqLLM();
      break;
    case "mistral":
      cachedLLM = createMistralLLM();
      break;
    default:
      throw new Error(
        `Unknown LLM_PROVIDER: "${provider}". Supported values: groq, gemini, mistral`
      );
  }

  console.log(`[LLM Factory] Active provider: ${provider}`);
  return cachedLLM;
}

/**
 * resetLLM — Clear the cache (useful for testing or hot-reload).
 */
function resetLLM() {
  cachedLLM = null;
}

module.exports = { getLLM, resetLLM };
