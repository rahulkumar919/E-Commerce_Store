/**
 * ingestion.js — RAG document & application data ingestion pipeline
 * ─────────────────────────────────────────────────────────────────
 * Populates Pinecone vector database with:
 *   1. Store policies, FAQs, and store guides (from documents/)
 *   2. Active products from MongoDB (catalog, pricing, descriptions, stock)
 *   3. Categories & serviceable cities
 *   4. Store contact & site settings
 *
 * Pipeline:
 *   Data sources → document builder → splitter → gemini embeddings → Pinecone
 *
 * Usage:
 *   node ai-agent/src/rag/ingestion.js
 */

"use strict";

require("dotenv").config();

const fs         = require("fs");
const path       = require("path");
const mongoose   = require("mongoose");
const { RecursiveCharacterTextSplitter } = require("@langchain/textsplitters");
const { Pinecone }       = require("@pinecone-database/pinecone");
const { getEmbeddings }  = require("./embeddings");

const productModel  = require("../../../models/productModel");
const categoryModel = require("../../../models/categoryModel");
const cityModel     = require("../../../models/cityModel");
const siteSettings  = require("../../../models/siteSettings");

const DOCS_DIR      = path.join(__dirname, "documents");
const CHUNK_SIZE    = parseInt(process.env.RAG_CHUNK_SIZE    || "600", 10);
const CHUNK_OVERLAP = parseInt(process.env.RAG_CHUNK_OVERLAP || "80",  10);

/**
 * loadLocalDocuments — Read policy and FAQ markdown files
 */
function loadLocalDocuments() {
  const docs = [];

  function walk(dir, documentType) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath, entry.name);
      } else if ([".md", ".txt"].includes(path.extname(entry.name))) {
        const content = fs.readFileSync(fullPath, "utf8").trim();
        if (content) {
          docs.push({
            content,
            metadata: {
              source:       entry.name,
              documentType: documentType || "policy",
              title:        path.basename(entry.name, path.extname(entry.name))
                              .replace(/-/g, " ")
                              .replace(/\b\w/g, (c) => c.toUpperCase()),
              createdAt:    new Date().toISOString(),
            },
          });
        }
      }
    }
  }

  walk(path.join(DOCS_DIR, "policies"), "policy");
  walk(path.join(DOCS_DIR, "faq"),      "faq");
  walk(path.join(DOCS_DIR, "store"),    "store");

  console.log(`📄 Loaded ${docs.length} local document(s) from ${DOCS_DIR}`);
  return docs;
}

/**
 * loadDatabaseDocuments — Fetch products, categories, and settings from MongoDB
 */
async function loadDatabaseDocuments() {
  const docs = [];

  try {
    if (mongoose.connection.readyState !== 1) {
      if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not set");
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // 1. Ingest Products
    const products = await productModel.find({ isAvailable: true }).lean();
    console.log(`📦 Loaded ${products.length} product(s) from MongoDB`);

    for (const p of products) {
      const parts = [
        `# Product: ${p.productName}`,
        `Category: ${p.category || "Produce"}`,
        p.subcategory ? `Subcategory: ${p.subcategory}` : null,
        p.brandName ? `Brand: ${p.brandName}` : "Brand: STM Fruit Shop",
        `Selling Price: ₹${p.selling} (Original MRP: ₹${p.price || p.selling})`,
        `Stock Status: ${p.stock > 0 ? `In Stock (${p.stock} units available)` : "In Stock"}`,
        p.description ? `Description: ${p.description}` : null,
        p.productDetails?.length ? `Highlights: ${p.productDetails.join("; ")}` : null,
        p.badge ? `Tag: ${p.badge}` : null,
        p.offerText ? `Special Offer: ${p.offerText}` : null,
      ].filter(Boolean);

      docs.push({
        content: parts.join("\n"),
        metadata: {
          source:       "mongodb-products",
          documentType: "product",
          productId:    p._id.toString(),
          productName:  p.productName,
          category:     p.category || "",
          price:        p.selling,
          title:        p.productName,
          createdAt:    new Date().toISOString(),
        },
      });
    }

    // 2. Ingest Categories
    const categories = await categoryModel.find().lean();
    if (categories.length) {
      const catList = categories.map((c) => c.categoryName || c.name).filter(Boolean);
      docs.push({
        content: `# Store Categories\nSTM Fruit Shop offers the following categories of fresh goods:\n- ${catList.join("\n- ")}`,
        metadata: {
          source:       "mongodb-categories",
          documentType: "store-info",
          title:        "Store Categories",
          createdAt:    new Date().toISOString(),
        },
      });
    }

    // 3. Ingest Serviceable Cities
    const cities = await cityModel.find().lean();
    if (cities.length) {
      const cityNames = cities.map((c) => c.cityName || c.name).filter(Boolean);
      docs.push({
        content: `# Serviceable Delivery Locations\nSTM Fruit Shop delivers fresh fruits, dry fruits, and cakes across major locations including:\n${cityNames.join(", ")}.\nExpress delivery is available in Sitamarhi.`,
        metadata: {
          source:       "mongodb-cities",
          documentType: "shipping",
          title:        "Delivery Locations",
          createdAt:    new Date().toISOString(),
        },
      });
    }

    // 4. Ingest Site Settings
    const settings = await siteSettings.findOne().lean();
    if (settings) {
      docs.push({
        content: [
          `# STM Fruit Shop Details & Contact Info`,
          settings.storeName ? `Store Name: ${settings.storeName}` : `Store Name: STM Fruit Shop`,
          settings.contactNumber ? `Support WhatsApp / Phone: ${settings.contactNumber}` : `Support Phone: +91 9142517255`,
          settings.supportEmail ? `Support Email: ${settings.supportEmail}` : `Support Email: support@stmfruitshop.com`,
          settings.address ? `Address: ${settings.address}` : null,
          `Operating Hours: 9:00 AM – 9:00 PM daily`,
        ].filter(Boolean).join("\n"),
        metadata: {
          source:       "mongodb-sitesettings",
          documentType: "store-info",
          title:        "Store Contact and Support",
          createdAt:    new Date().toISOString(),
        },
      });
    }
  } catch (err) {
    console.error("⚠️ Failed to load database documents:", err.message);
  }

  return docs;
}

/**
 * ingest — Full ingestion pipeline
 */
async function ingest({ cleanOld = true } = {}) {
  console.log("🚀 Starting complete Application Data Ingestion into Pinecone…");

  // Load all documents
  const localDocs = loadLocalDocuments();
  const dbDocs    = await loadDatabaseDocuments();
  const allDocs   = [...localDocs, ...dbDocs];

  if (!allDocs.length) {
    console.warn("⚠️  No documents found to ingest.");
    return;
  }

  console.log(`📊 Total application documents assembled: ${allDocs.length}`);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize:    CHUNK_SIZE,
    chunkOverlap: CHUNK_OVERLAP,
  });

  const chunks = [];
  for (const doc of allDocs) {
    const parts = await splitter.createDocuments(
      [doc.content],
      [doc.metadata]
    );
    chunks.push(...parts);
  }

  console.log(`✂️  Generated ${chunks.length} chunks for vector database.`);

  // Connect to Pinecone
  if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX_NAME) {
    throw new Error("PINECONE_API_KEY and PINECONE_INDEX_NAME must be set");
  }

  const pinecone      = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);

  if (cleanOld) {
    console.log("🧹 Clearing old vectors from Pinecone index…");
    try {
      await pineconeIndex.deleteAll();
      console.log("✨ Index cleared.");
    } catch (delErr) {
      console.warn("⚠️  Could not clear old vectors:", delErr.message);
    }
  }

  console.log(`📡 Embedding and upserting ${chunks.length} chunks to Pinecone index: ${process.env.PINECONE_INDEX_NAME}…`);

  const BATCH_SIZE = 20;
  const embeddings = getEmbeddings();

  function cleanMetadata(rawMeta = {}) {
    const clean = {};
    for (const [key, val] of Object.entries(rawMeta)) {
      if (key === "loc") continue; // strip LangChain's line range object
      if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
        clean[key] = val;
      } else if (Array.isArray(val)) {
        clean[key] = val.map(String);
      } else if (val !== null && typeof val === "object") {
        clean[key] = JSON.stringify(val);
      }
    }
    return clean;
  }

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const batchTexts = batch.map((c) => c.pageContent);
    const batchEmbeddings = await embeddings.embedDocuments(batchTexts);

    const records = batch.map((chunk, idx) => {
      const globalIdx = i + idx;
      let docId = "";
      if (chunk.metadata?.documentType === "policy") {
        const fileBase = (chunk.metadata.source || "policy")
          .replace(/\.(md|txt)$/, "")
          .replace(/[^a-zA-Z0-9_-]/g, "-")
          .toLowerCase();
        docId = `doc-policy-${fileBase}-${globalIdx}`;
      } else if (chunk.metadata?.documentType === "faq") {
        docId = `doc-faq-general-${globalIdx}`;
      } else if (chunk.metadata?.documentType === "product") {
        const prodName = (chunk.metadata.productName || "item")
          .replace(/[^a-zA-Z0-9_-]/g, "-")
          .toLowerCase()
          .slice(0, 30);
        docId = `prod-${prodName}-${chunk.metadata.productId || globalIdx}`;
      } else if (chunk.metadata?.documentType === "shipping") {
        docId = `doc-shipping-locations-${globalIdx}`;
      } else if (chunk.metadata?.documentType === "store-info") {
        const titleBase = (chunk.metadata.title || "info")
          .replace(/[^a-zA-Z0-9_-]/g, "-")
          .toLowerCase();
        docId = `doc-store-${titleBase}-${globalIdx}`;
      } else {
        docId = `doc-${chunk.metadata?.source || "item"}-${globalIdx}`;
      }

      return {
        id: docId,
        values: batchEmbeddings[idx],
        metadata: {
          ...cleanMetadata(chunk.metadata),
          text: chunk.pageContent,
        },
      };
    });

    await pineconeIndex.upsert({ records });
    console.log(`  ✅ Upserted batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(chunks.length / BATCH_SIZE)} (${records.length} records)`);
  }

  console.log("🎉 All application data ingested successfully into Pinecone vector database!");
}

// Run if called directly
if (require.main === module) {
  ingest()
    .then(() => {
      console.log("✅ Done.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Ingestion failed:", err);
      process.exit(1);
    });
}

module.exports = { ingest };
