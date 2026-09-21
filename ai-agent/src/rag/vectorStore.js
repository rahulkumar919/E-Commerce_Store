/**
 * vectorStore.js — Pinecone wrapper
 * ───────────────────────────────────
 * Single place that knows about Pinecone. Everything else calls getVectorStore().
 *
 * Uses @langchain/pinecone which wraps @pinecone-database/pinecone.
 * The index must already exist in Pinecone before calling this.
 */

"use strict";

const { PineconeStore }  = require("@langchain/pinecone");
const { Pinecone }       = require("@pinecone-database/pinecone");
const { getEmbeddings }  = require("./embeddings");

let cachedVectorStore = null;

async function getVectorStore() {
  if (cachedVectorStore) return cachedVectorStore;

  if (!process.env.PINECONE_API_KEY)       throw new Error("PINECONE_API_KEY not set");
  if (!process.env.PINECONE_INDEX_NAME)    throw new Error("PINECONE_INDEX_NAME not set");

  const pinecone     = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);

  cachedVectorStore = await PineconeStore.fromExistingIndex(
    getEmbeddings(),
    { pineconeIndex }
  );

  return cachedVectorStore;
}

/** Reset cache (used in tests) */
function resetVectorStore() {
  cachedVectorStore = null;
}

module.exports = { getVectorStore, resetVectorStore };
