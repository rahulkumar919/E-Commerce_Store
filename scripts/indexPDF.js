/**
 * indexPDF.js — Ingest PDF files into Pinecone RAG
 * ──────────────────────────────────────────────────
 * Use this when your knowledge base is a PDF (product catalogue, store guide, etc.)
 * instead of .md / .txt files.
 *
 * Usage:
 *   node scripts/indexPDF.js --file config/fruitdata.pdf
 *   node scripts/indexPDF.js --file path/to/any.pdf
 *
 * Requires: GEMINI_API_KEY, PINECONE_API_KEY, PINECONE_INDEX_NAME in .env
 *
 * The Pinecone index must already exist. Create it at https://app.pinecone.io
 * Dimensions: 768  (text-embedding-004)
 * Metric:     cosine
 */

"use strict";

require("dotenv").config();

const fs   = require("fs");
const path = require("path");

// Parse --file argument
const fileArgIdx = process.argv.indexOf("--file");
const pdfPath    = fileArgIdx !== -1
  ? path.resolve(process.argv[fileArgIdx + 1])
  : path.resolve(__dirname, "../config/fruitdata.pdf");

if (!fs.existsSync(pdfPath)) {
  console.error(`❌ PDF not found: ${pdfPath}`);
  console.error("Usage: node scripts/indexPDF.js --file path/to/file.pdf");
  process.exit(1);
}

async function run() {
  const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
  const { PineconeStore }  = require("@langchain/pinecone");
  const { Pinecone }       = require("@pinecone-database/pinecone");
  const pdfParse           = require("pdf-parse");
  const { getEmbeddings }  = require("../ai-agent/src/rag/embeddings");

  console.log(`\n📄 Loading PDF: ${pdfPath}`);
  const buffer    = fs.readFileSync(pdfPath);
  const pdfData   = await pdfParse(buffer);
  const rawText   = pdfData.text.trim();

  if (!rawText) {
    console.error("❌ PDF appears to be empty or could not be parsed");
    process.exit(1);
  }

  console.log(`   Pages: ${pdfData.numpages} | Characters: ${rawText.length}`);

  // Chunk the text
  const CHUNK_SIZE    = parseInt(process.env.RAG_CHUNK_SIZE    || "600", 10);
  const CHUNK_OVERLAP = parseInt(process.env.RAG_CHUNK_OVERLAP || "80",  10);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize:    CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  });

  const fileName = path.basename(pdfPath, ".pdf");
  const chunks   = await splitter.createDocuments(
    [rawText],
    [{
      source:       path.basename(pdfPath),
      title:        fileName.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
      documentType: "pdf",
      createdAt:    new Date().toISOString(),
    }]
  );

  console.log(`✂️  Split into ${chunks.length} chunks (size=${CHUNK_SIZE}, overlap=${CHUNK_OVERLAP})`);

  // Validate Pinecone config
  if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX_NAME) {
    throw new Error("PINECONE_API_KEY and PINECONE_INDEX_NAME must be set in .env");
  }

  const pinecone      = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);

  console.log(`\n📡 Upserting to Pinecone index: ${process.env.PINECONE_INDEX_NAME} …`);

  await PineconeStore.fromDocuments(chunks, getEmbeddings(), { pineconeIndex });

  console.log(`✅ PDF ingestion complete! ${chunks.length} chunks indexed.\n`);
}

run().catch((err) => {
  console.error("❌ PDF ingestion failed:", err.message);
  process.exit(1);
});
