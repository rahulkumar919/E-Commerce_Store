/**
 * RAG System Setup Script
 * Run this once to initialize the RAG system
 * 
 * Usage: node scripts/setupRAG.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const KnowledgeChunk = require('../models/knowledgeChunkModel');
const { processKnowledgeBase } = require('../services/ragService');

async function setupRAG() {
    try {
        console.log("🚀 Starting RAG System Setup...\n");
        
        // Check environment variables
        if (!process.env.GEMINI_API_KEY) {
            console.error("❌ Error: GEMINI_API_KEY not found in .env file");
            console.log("📝 Please add your Gemini API key to .env:");
            console.log("   GEMINI_API_KEY=your_api_key_here\n");
            process.exit(1);
        }
        
        if (!process.env.MONGODB_URI) {
            console.error("❌ Error: MONGODB_URI not found in .env file");
            process.exit(1);
        }
        
        console.log("✅ Environment variables found");
        
        // Connect to MongoDB
        console.log("🔌 Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to MongoDB\n");
        
        // Process knowledge base
        console.log("📚 Processing knowledge base...");
        console.log("⏱️  This may take 3-5 minutes...\n");
        
        const result = await processKnowledgeBase(KnowledgeChunk);
        
        console.log("\n✅ Setup Complete!");
        console.log(`📊 Processed ${result.chunksProcessed} chunks`);
        console.log("\n🎉 Your RAG system is ready to use!");
        console.log("\n📝 Next steps:");
        console.log("   1. Start your backend server: npm start");
        console.log("   2. Test the AI chat at: POST /api/ai/chat");
        console.log("   3. Open your frontend and click the AI Assistant button\n");
        
        process.exit(0);
        
    } catch (error) {
        console.error("\n❌ Setup failed:", error.message);
        console.error("\n🔍 Troubleshooting:");
        console.error("   1. Check your GEMINI_API_KEY is valid");
        console.error("   2. Ensure MongoDB is running");
        console.error("   3. Check backend/data/knowledge-base.md exists");
        console.error("   4. See RAG_SYSTEM_GUIDE.md for more help\n");
        process.exit(1);
    }
}

// Run setup
setupRAG();
