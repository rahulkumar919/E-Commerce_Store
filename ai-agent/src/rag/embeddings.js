/**
 * embeddings.js — Embedding model provider
 * ──────────────────────────────────────────
 * INDEPENDENT from the chat LLM provider.
 * You can use Gemini for chat and any embedder for RAG.
 *
 * Current: Google's text-embedding-004 via @langchain/google-genai
 * Future:  Swap to OpenAI/Mistral/HuggingFace by changing EMBEDDING_PROVIDER env var.
 *
 * Cached at module level — one instance per server process.
 */

"use strict";

const { GoogleGenerativeAIEmbeddings } = require("@langchain/google-genai");

let cachedEmbeddings = null;

function getEmbeddings() {
  if (cachedEmbeddings) return cachedEmbeddings;

  const provider = (process.env.EMBEDDING_PROVIDER || "gemini").toLowerCase();

  if (provider === "gemini") {
    if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY required for embeddings");
    cachedEmbeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      model:  process.env.EMBEDDING_MODEL || "gemini-embedding-001",
      outputDimensionality: parseInt(process.env.EMBEDDING_DIMENSIONS || "768", 10),
    });
    return cachedEmbeddings;
  }

  throw new Error(`Unknown EMBEDDING_PROVIDER: ${provider}. Supported: gemini`);
}

module.exports = { getEmbeddings };
