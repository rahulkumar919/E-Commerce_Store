/**
 * AI Chat Controller with Pinecone
 * Handles user queries using Pinecone vector search and LangChain
 */

const productModel = require('../../models/productModel');
const { generateRAGResponsePinecone, conversationMemory } = require('../../services/ragServicePinecone');

async function chatWithAIPinecone(req, res) {
    try {
        const { query, userId } = req.body;
        
        if (!query || query.trim() === '') {
            return res.status(400).json({
                success: false,
                message: "Query is required"
            });
        }
        
        console.log("💬 User Query:", query);
        
        // Add to conversation memory (optional)
        if (userId) {
            conversationMemory.addMessage(userId, 'user', query);
        }
        
        // Generate RAG response
        const response = await generateRAGResponsePinecone(
            query,
            productModel
        );
        
        // Add AI response to memory (optional)
        if (userId) {
            conversationMemory.addMessage(userId, 'assistant', response.message);
        }
        
        res.json(response);
        
    } catch (error) {
        console.error("Error in AI chat with Pinecone:", error);
        res.status(500).json({
            success: false,
            message: "Failed to generate response",
            error: error.message
        });
    }
}

module.exports = chatWithAIPinecone;
