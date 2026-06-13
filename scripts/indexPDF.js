/**
 * Phase 1: PDF Indexing Script
 * Uses Pinecone's native integrated embedding (llama-text-embed-v2, 1024-dim)
 * so we pass plain text — no external embedding step needed.
 *
 * Run once:  node scripts/indexPDF.js
 */

require('dotenv').config();

const { PDFLoader }                      = require('@langchain/community/document_loaders/fs/pdf');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
const { Pinecone }                       = require('@pinecone-database/pinecone');
const path                               = require('path');

const CHUNK_SIZE    = 1000;
const CHUNK_OVERLAP = 200;
const BATCH_SIZE    = 90;   // Pinecone upsert batch limit
const PDF_PATH      = path.join(__dirname, '../config/fruitdata.pdf');

async function indexDocument() {
    try {
        console.log('\n🚀 ============================');
        console.log('   STM Fruit Shop - PDF Indexer');
        console.log('================================\n');

        // ── Step 1: Load PDF ──────────────────────────────────────────
        console.log('📄 Step 1: Loading PDF...');
        const pdfLoader = new PDFLoader(PDF_PATH);
        const rawDocs   = await pdfLoader.load();
        console.log(`   ✅ Loaded ${rawDocs.length} page(s)\n`);

        // ── Step 2: Chunk ─────────────────────────────────────────────
        console.log('✂️  Step 2: Chunking...');
        const splitter    = new RecursiveCharacterTextSplitter({
            chunkSize:    CHUNK_SIZE,
            chunkOverlap: CHUNK_OVERLAP,
        });
        const chunkedDocs = await splitter.splitDocuments(rawDocs);
        console.log(`   ✅ Created ${chunkedDocs.length} chunks\n`);

        // ── Step 3: Connect to Pinecone (integrated embedding index) ──
        console.log('🌲 Step 3: Connecting to Pinecone...');
        const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
        const index    = pinecone.Index(process.env.PINECONE_INDEX_NAME);
        console.log(`   ✅ Connected to index: ${process.env.PINECONE_INDEX_NAME}\n`);

        // ── Step 4: Upsert records with plain text ────────────────────
        // The index uses llama-text-embed-v2 (integrated), so we pass
        // { id, text, metadata } — Pinecone embeds the text automatically.
        console.log(`📤 Step 4: Upserting ${chunkedDocs.length} records in batches of ${BATCH_SIZE}...`);

        let uploaded = 0;
        for (let i = 0; i < chunkedDocs.length; i += BATCH_SIZE) {
            const batch   = chunkedDocs.slice(i, i + BATCH_SIZE);
            const records = batch.map((doc, j) => ({
                id:       `pdf-chunk-${Date.now()}-${i + j}`,
                text:     doc.pageContent,           // field mapped to "text" in the index
                metadata: {
                    source:   'fruitdata.pdf',
                    page:     doc.metadata?.loc?.pageNumber ?? (i + j),
                    chunk:    i + j,
                },
            }));

            await index.upsertRecords({ records });
            uploaded += records.length;
            console.log(`   ✅ Batch ${Math.floor(i / BATCH_SIZE) + 1} uploaded (${uploaded}/${chunkedDocs.length})`);
        }

        console.log('\n✅ ============================');
        console.log('   All data stored in Pinecone!');
        console.log('==============================\n');
        console.log(`📊 Summary:`);
        console.log(`   • PDF pages  : ${rawDocs.length}`);
        console.log(`   • Chunks     : ${chunkedDocs.length}`);
        console.log(`   • Uploaded   : ${uploaded}`);
        console.log(`   • Index name : ${process.env.PINECONE_INDEX_NAME}`);
        console.log('\n🎉 Indexing complete. You can now start the server.\n');

        process.exit(0);
    } catch (err) {
        console.error('\n❌ Indexing failed:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
}

indexDocument();
