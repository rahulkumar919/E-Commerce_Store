/**
 * AI Chat Controller
 * Handles user queries and returns AI-generated responses with product recommendations
 */

const KnowledgeChunk = require('../../models/knowledgeChunkModel');
const productModel = require('../../models/productModel');
const { generateRAGResponse } = require('../../services/ragService');

async function chatWithAI(req, res) {
    try {
        const { query } = req.body;
        
        if (!query || query.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Query is required"
            });
        }
        
        console.log("💬 User Query:", query);
        
        // Generate RAG response
        const response = await generateRAGResponse(
            query,
            KnowledgeChunk,
            productModel
        );
        
        res.json(response);
        
    } catch (error) {
        console.error("Error in AI chat:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate response",
            error: error.message
        });
    }
}

module.exports = chatWithAI;
