/**
 * Setup Script for Enhanced RAG System
 * Processes knowledge base and stores in Pinecone
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { processKnowledgeBaseToPinecone } = require('../services/enhancedRAGService');

async function setupEnhancedRAG() {
    try {
        console.log("\n🚀 Enhanced RAG Setup Starting...\n");
        
        // Check environment variables
        console.log("📋 Checking configuration...");
        
        if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_REAL_GEMINI_API_KEY_HERE') {
            console.error("❌ GEMINI_API_KEY not configured in .env file");
            console.log("Please add your Gemini API key from: https://aistudio.google.com/app/apikey");
            process.exit(1);
        }
        
        if (!process.env.PINECONE_API_KEY) {
            console.error("❌ PINECONE_API_KEY not configured in .env file");
            process.exit(1);
        }
        
        if (!process.env.PINECONE_INDEX_NAME) {
            console.error("❌ PINECONE_INDEX_NAME not configured in .env file");
            process.exit(1);
        }
        
        console.log("✅ Configuration verified\n");
        
        // Connect to MongoDB
        console.log("🔌 Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ MongoDB connected\n");
        
        // Process knowledge base to Pinecone
        const result = await processKnowledgeBaseToPinecone();
        
        console.log("\n✅ Setup Complete!");
        console.log(`📊 Total vectors processed: ${result.vectorsProcessed}`);
        console.log("\n🎉 Your Enhanced RAG system is ready!");
        console.log("You can now use the /api/ai/chat-enhanced endpoint\n");
        
        process.exit(0);
        
    } catch (error) {
        console.error("\n❌ Setup failed:", error);
        process.exit(1);
    }
}

// Run setup
setupEnhancedRAG();
