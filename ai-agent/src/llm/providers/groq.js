/**
 * groq.js — Groq chat LLM provider
 * ──────────────────────────────────
 * Returns a configured ChatGroq instance (ultra-fast inference via Groq).
 * The agent NEVER imports this directly — it calls getLLM() from ../index.js.
 *
 * Config pulled from env:
 *   GROQ_API_KEY      required  — get from https://console.groq.com/keys
 *   GROQ_MODEL        default: llama-3.3-70b-versatile  (supports tool calling)
 *   GROQ_TEMPERATURE  default: 0.3
 *   GROQ_MAX_TOKENS   default: 1024
 *
 * Good models that support tool calling:
 *   llama-3.3-70b-versatile  — smartest, recommended
 *   llama-3.1-70b-versatile  — fast + smart
 *   llama-3.1-8b-instant     — fastest, lighter
 */

"use strict";

const { ChatGroq } = require("@langchain/groq");

function createGroqLLM() {
  const key = process.env.GROQ_API_KEY;

  if (!key || key === "your_groq_api_key_here" || key.trim() === "") {
    throw new Error(
      "GROQ_API_KEY is not set. Get your free key at https://console.groq.com/keys and add it to backend/.env"
    );
  }

  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  console.log(`[Groq] Initializing model: ${model}`);

  return new ChatGroq({
    apiKey: key,
    model: model,
    temperature: parseFloat(process.env.GROQ_TEMPERATURE || "0.3"),
    maxTokens: parseInt(process.env.GROQ_MAX_TOKENS || "1024", 10),
  });
}

module.exports = { createGroqLLM };
