/**
 * Process Knowledge Base to Pinecone Controller (Legacy - Redirects to Enhanced)
 * Admin endpoint to process and store knowledge base in Pinecone
 */

const { processKnowledgeBaseToPinecone } = require('../../services/enhancedRAGService');

async function processKnowledgePineconeController(req, res) {
    try {
        console.log("🚀 Starting Pinecone knowledge base processing (Enhanced)...");
        
        const result = await processKnowledgeBaseToPinecone();
        
        res.json({
            success: true,
            message: "Knowledge base processed and stored in Pinecone successfully",
            data: result
        });
        
    } catch (error) {
        console.error("Error processing knowledge base to Pinecone:", error);
        res.status(500).json({
            success: false,
            message: "Failed to process knowledge base",
            error: error.message
        });
    }
}

module.exports = processKnowledgePineconeController;
