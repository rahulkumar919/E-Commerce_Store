/**
 * Setup Script for Professional RAG System
 * Processes PDF and stores in Pinecone
 */

require('dotenv').config();
const { processPDFToPinecone } = require('../services/professionalRAGService');
const path = require('path');

async function setup() {
    try {
        console.log("\n" + "=".repeat(70));
        console.log("🚀 PROFESSIONAL RAG SYSTEM SETUP");
        console.log("=".repeat(70));
        console.log("📄 Processing PDF and storing in Pinecone vector database");
        console.log("⏰ Started at:", new Date().toLocaleString());
        console.log("=".repeat(70) + "\n");

        // Check environment variables
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY not found in environment variables");
        }
        if (!process.env.PINECONE_API_KEY) {
            throw new Error("PINECONE_API_KEY not found in environment variables");
        }
        if (!process.env.PINECONE_INDEX_NAME) {
            throw new Error("PINECONE_INDEX_NAME not found in environment variables");
        }

        console.log("✅ Environment variables verified\n");

        // Path to PDF
        const pdfPath = path.join(__dirname, '../data/ragdata.pdf');
        console.log("📁 PDF Path:", pdfPath);
        console.log("");

        // Process PDF
        const result = await processPDFToPinecone(pdfPath);

        console.log("\n" + "=".repeat(70));
        console.log("✅ SETUP COMPLETE!");
        console.log("=".repeat(70));
        console.log("📊 Results:");
        console.log(`   - Total Chunks: ${result.totalChunks}`);
        console.log(`   - Processed: ${result.processedChunks}`);
        console.log(`   - Success Rate: ${((result.processedChunks / result.totalChunks) * 100).toFixed(2)}%`);
        console.log("⏰ Completed at:", new Date().toLocaleString());
        console.log("=".repeat(70));
        console.log("\n🎉 Your AI Assistant is now ready to answer questions!");
        console.log("💡 Test it by asking questions about fruits and dry fruits\n");

        process.exit(0);

    } catch (error) {
        console.error("\n" + "=".repeat(70));
        console.error("❌ SETUP FAILED");
        console.error("=".repeat(70));
        console.error("Error:", error.message);
        console.error("=".repeat(70) + "\n");
        process.exit(1);
    }
}

// Run setup
setup();
