/**
 * gemini.js — Gemini chat LLM provider
 * ──────────────────────────────────────
 * Returns a configured ChatGoogleGenerativeAI instance.
 * The agent NEVER imports this directly — it calls getLLM() from ../index.js.
 *
 * Config pulled from env (all have sensible defaults):
 *   GEMINI_API_KEY      required
 *   GEMINI_MODEL        default: gemini-1.5-flash
 *   GEMINI_TEMPERATURE  default: 0.3
 *   GEMINI_MAX_TOKENS   default: 1024
 */

"use strict";

const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");

function createGeminiLLM() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not set in environment variables");
  }

  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";

  console.log(`[Gemini] Initializing model: ${model}`);

  return new ChatGoogleGenerativeAI({
    apiKey:          process.env.GEMINI_API_KEY,
    model:           model,
    temperature:     parseFloat(process.env.GEMINI_TEMPERATURE || "0.3"),
    maxOutputTokens: parseInt(process.env.GEMINI_MAX_TOKENS  || "1024", 10),
  });
}

module.exports = { createGeminiLLM };
