/**
 * inspectVectorDB.js — Inspect what is currently stored in the Pinecone Vector Database
 * ─────────────────────────────────────────────────────────────────────────────────────
 * Usage:
 *   node scripts/inspectVectorDB.js
 */

"use strict";

require("dotenv").config();

const { Pinecone } = require("@pinecone-database/pinecone");

async function inspect() {
  console.log("🔍 Connecting to Pinecone Vector Database…");

  if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX_NAME) {
    console.error("❌ Missing PINECONE_API_KEY or PINECONE_INDEX_NAME in .env");
    process.exit(1);
  }

  const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);

  const stats = await index.describeIndexStats();
  console.log("\n📊 Pinecone Index Summary:");
  console.log(`   Index Name:        ${process.env.PINECONE_INDEX_NAME}`);
  console.log(`   Total Vectors:     ${stats.totalRecordCount}`);
  console.log(`   Dimensions:        ${stats.dimension}`);
  console.log(`   Namespaces:        ${JSON.stringify(stats.namespaces || {})}`);

  console.log("\n📑 Fetching sample stored documents & products from vector database…");

  // Query with a neutral vector to list records
  const queryResult = await index.query({
    topK: 50,
    vector: Array(768).fill(0.01),
    includeMetadata: true,
  });

  if (!queryResult.matches || queryResult.matches.length === 0) {
    console.log("⚠️ No records found in the index.");
    return;
  }

  console.log(`\nFound ${queryResult.matches.length} sample vector records:\n`);

  const groups = {};
  for (const m of queryResult.matches) {
    const docType = m.metadata?.documentType || "general";
    if (!groups[docType]) groups[docType] = [];
    groups[docType].push(m);
  }

  for (const [type, items] of Object.entries(groups)) {
    console.log(`\n================== [ ${type.toUpperCase()} ] (${items.length} records) ==================`);
    for (const item of items) {
      console.log(`\n🔹 Vector ID: ${item.id}`);
      console.log(`   Title:     ${item.metadata?.title || "N/A"}`);
      console.log(`   Source:    ${item.metadata?.source || "N/A"}`);
      if (item.metadata?.price) console.log(`   Price:     ₹${item.metadata.price}`);
      const textPreview = (item.metadata?.text || "").replace(/\n+/g, " ").slice(0, 140);
      console.log(`   Snippet:   ${textPreview}…`);
    }
  }

  console.log("\n✅ Inspection complete!\n");
}

inspect().catch((err) => {
  console.error("❌ Error inspecting vector DB:", err.message);
  process.exit(1);
});
