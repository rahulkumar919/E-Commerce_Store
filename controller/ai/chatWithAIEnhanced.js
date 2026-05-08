/**
 * Enhanced AI Chat Controller
 * Uses Pinecone Vector Search + MongoDB Products + Gemini AI
 * Falls back to MongoDB-only if Pinecone fails
 */

const productModel = require('../../models/productModel');
const { generateEnhancedRAGResponse } = require('../../services/enhancedRAGService');
const { generateRAGResponse } = require('../../services/ragService');

async function chatWithAIEnhanced(req, res) {
    try {
        const { query, userId } = req.body;
        
        if (!query || query.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Query is required"
            });
        }
        
        console.log("\n💬 Enhanced RAG Chat Request");
        console.log("User Query:", query);
        console.log("User ID:", userId || 'Anonymous');
        
        try {
            // Try enhanced RAG with Pinecone first
            const response = await generateEnhancedRAGResponse(
                query,
                productModel
            );
            
            console.log("✅ Enhanced response generated successfully\n");
            res.json(response);
            
        } catch (enhancedError) {
            console.log("⚠️ Enhanced RAG failed, falling back to MongoDB-only");
            console.error("Enhanced error:", enhancedError.message);
            
            // Fallback to MongoDB-only RAG
            const fallbackResponse = await generateRAGResponse(
                query,
                productModel
            );
            
            console.log("✅ Fallback response generated successfully\n");
            res.json(fallbackResponse);
        }
        
    } catch (error) {
        console.error("❌ Error in Enhanced AI chat:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate response. Please try again.",
            error: error.message
        });
    }
}

module.exports = chatWithAIEnhanced;
