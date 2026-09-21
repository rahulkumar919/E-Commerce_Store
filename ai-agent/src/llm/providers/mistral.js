/**
 * mistral.js — Mistral chat LLM provider (placeholder)
 * ──────────────────────────────────────────────────────
 * This file proves that the LLM provider abstraction works.
 * To activate: set LLM_PROVIDER=mistral in .env and install:
 *   npm install @langchain/mistralai
 *
 * The agent.js and every tool are completely unaware of which provider is active.
 * Only getLLM() in ../index.js reads LLM_PROVIDER and constructs the right object.
 */

"use strict";

function createMistralLLM() {
  // Lazy require so the package is only needed when Mistral is the active provider
  let ChatMistralAI;
  try {
    ({ ChatMistralAI } = require("@langchain/mistralai"));
  } catch {
    throw new Error(
      "Mistral provider selected but @langchain/mistralai is not installed.\n" +
      "Run: npm install @langchain/mistralai"
    );
  }

  if (!process.env.MISTRAL_API_KEY) {
    throw new Error("MISTRAL_API_KEY is not set in environment variables");
  }

  return new ChatMistralAI({
    apiKey:      process.env.MISTRAL_API_KEY,
    model:       process.env.MISTRAL_MODEL       || "mistral-medium",
    temperature: parseFloat(process.env.MISTRAL_TEMPERATURE || "0.3"),
    maxTokens:   parseInt(process.env.MISTRAL_MAX_TOKENS || "1024", 10),
  });
}

module.exports = { createMistralLLM };
