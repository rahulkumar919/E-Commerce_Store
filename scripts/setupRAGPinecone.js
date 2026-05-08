/**
 * RAG System Setup Script with Pinecone
 * Run this once to initialize the RAG system with Pinecone
 * 
 * Usage: node scripts/setupRAGPinecone.js
 */

require('dotenv').config();
const { processKnowledgeBaseToPinecone } = require('../services/ragServicePinecone');

async function setupRAGPinecone() {
    try {
        console.log("🚀 Starting RAG System Setup with Pinecone...\n");
        
        // Check environment variables
        if (!process.env.GEMINI_API_KEY) {
            console.error("❌ Error: GEMINI_API_KEY not found in .env file");
            console.log("📝 Please add your Gemini API key to .env:");
            console.log("   GEMINI_API_KEY=your_api_key_here\n");
            process.exit(1);
        }
        
        if (!process.env.PINECONE_API_KEY) {
            console.error("❌ Error: PINECONE_API_KEY not found in .env file");
            console.log("📝 Please add your Pinecone credentials to .env:");
            console.log("   PINECONE_API_KEY=your_pinecone_api_key");
            console.log("   PINECONE_ENVIRONMENT=your_environment");
            console.log("   PINECONE_INDEX_NAME=stm-fruit-shop\n");
            process.exit(1);
        }
        
        console.log("✅ Environment variables found");
        
        // Process knowledge base
        console.log("📚 Processing knowledge base to Pinecone...");
        console.log("⏱️  This may take 3-5 minutes...\n");
        
        const result = await processKnowledgeBaseToPinecone();
        
        console.log("\n✅ Setup Complete!");
        console.log(`📊 Processed ${result.chunksProcessed} chunks`);
        console.log("\n🎉 Your RAG system with Pinecone is ready to use!");
        console.log("\n📝 Next steps:");
        console.log("   1. Start your backend server: npm start");
        console.log("   2. Test the AI chat at: POST /api/ai/chat-pinecone");
        console.log("   3. Open your frontend and click the AI Assistant button\n");
        
        process.exit(0);
        
    } catch (error) {
        console.error("\n❌ Setup failed:", error.message);
        console.error("\n🔍 Troubleshooting:");
        console.error("   1. Check your GEMINI_API_KEY is valid");
        console.error("   2. Check your PINECONE_API_KEY is valid");
        console.error("   3. Ensure Pinecone index exists");
        console.error("   4. Check backend/data/knowledge-base.md exists");
        console.error("   5. See PINECONE_SETUP_GUIDE.md for more help\n");
        process.exit(1);
    }
}

// Run setup
setupRAGPinecone();
