/**
 * retriever.js — RAG retrieval abstraction
 * ─────────────────────────────────────────
 * WHY SEPARATE FROM vectorStore.js:
 * vectorStore.js manages the Pinecone connection.
 * retriever.js manages the QUERY logic — similarity threshold, k, metadata filters.
 *
 * The agent calls retrieve(query) and gets back { docs, citations }.
 * It never knows whether the answer came from Pinecone, a file system, or a DB.
 *
 * WHAT RAG ANSWERS (stable knowledge only):
 *   Return policy, shipping, cancellation, FAQ, store info, general product knowledge
 *
 * WHAT RAG NEVER ANSWERS (live data — use tools instead):
 *   Current prices, stock levels, cart contents, order status
 */

"use strict";

const fs                 = require("fs");
const path               = require("path");
const { getVectorStore } = require("./vectorStore");
const aiLogger           = require("../utils/aiLogger");

const DEFAULT_K            = parseInt(process.env.RAG_TOP_K || "4", 10);
const SCORE_THRESHOLD      = parseFloat(process.env.RAG_SCORE_THRESHOLD || "0.05");

/**
 * searchLocalDocuments — Scan markdown files in documents/ as instant fallback.
 */
function searchLocalDocuments(query) {
  const docsDir = path.join(__dirname, "documents");
  if (!fs.existsSync(docsDir)) return [];

  const q = (query || "").toLowerCase();
  const matchedDocs = [];

  function scan(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scan(full);
      } else if (entry.name.endsWith(".md") || entry.name.endsWith(".txt")) {
        const content = fs.readFileSync(full, "utf8");
        const lower = content.toLowerCase();
        const words = q.split(/\s+/).filter((w) => w.length > 2);
        let score = 0;
        for (const w of words) {
          if (lower.includes(w)) score++;
        }
        if (score > 0 || lower.includes(q)) {
          matchedDocs.push({
            content,
            source: entry.name,
            title: entry.name.replace(/-/g, " ").replace(/\.(md|txt)$/, ""),
            score,
          });
        }
      }
    }
  }

  scan(docsDir);
  return matchedDocs.sort((a, b) => b.score - a.score).slice(0, 3);
}

/**
 * retrieve — Similarity search + local documents fallback
 *
 * @param {string} query         The user's question / search text
 * @param {object} [opts]
 * @param {number} [opts.k]      Number of docs to fetch
 * @param {string} [opts.requestId] For logging
 *
 * @returns {Promise<{ context: string, citations: object[], found: boolean }>}
 */
async function retrieve(query, opts = {}) {
  const { k = DEFAULT_K, requestId = "?" } = opts;
  const start = Date.now();

  try {
    let context = "";
    let citations = [];

    // 1. Try Pinecone vector search
    if (process.env.PINECONE_API_KEY && process.env.PINECONE_INDEX_NAME) {
      try {
        const { Pinecone } = require("@pinecone-database/pinecone");
        const { getEmbeddings } = require("./embeddings");

        const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
        const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);
        const embeddings = getEmbeddings();

        const queryVec = await embeddings.embedQuery(query);
        const queryRes = await pineconeIndex.query({
          topK: k,
          vector: queryVec,
          includeMetadata: true,
        });

        const relevant = (queryRes.matches || []).filter((m) => (m.score || 0) >= SCORE_THRESHOLD);

        if (relevant.length > 0) {
          context = relevant
            .map((m) => m.metadata?.text || m.metadata?.content || "")
            .filter(Boolean)
            .join("\n\n---\n\n");

          citations = relevant.map((m) => ({
            source: m.metadata?.source || "store-knowledge",
            title:  m.metadata?.title  || m.metadata?.documentType || "Store Information",
            score:  m.score,
          }));
        }
      } catch (pineconeErr) {
        aiLogger.warn("rag.pinecone_fallback", { requestId, error: pineconeErr.message });
      }
    }

    // 2. Local documents fallback if Pinecone returned no matching context
    if (!context.trim()) {
      const local = searchLocalDocuments(query);
      if (local.length > 0) {
        context = local.map((d) => d.content).join("\n\n---\n\n");
        citations = local.map((d) => ({
          source: d.source,
          title:  d.title,
        }));
      }
    }

    if (!context.trim()) {
      return { context: "", citations: [], found: false };
    }

    // Deduplicate citations by source
    const seen = new Set();
    const uniqueCitations = citations.filter(({ source }) => {
      if (seen.has(source)) return false;
      seen.add(source);
      return true;
    });

    aiLogger.ragRetrieve(requestId, query, uniqueCitations.length, Date.now() - start);
    return { context, citations: uniqueCitations, found: true };
  } catch (err) {
    aiLogger.error("rag.retrieve_error", { requestId, error: err.message });
    return { context: "", citations: [], found: false, error: err.message };
  }
}

module.exports = { retrieve };
