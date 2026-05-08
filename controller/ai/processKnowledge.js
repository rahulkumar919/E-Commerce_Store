/**
 * Process Knowledge Base Controller
 * Admin endpoint to process and store knowledge base embeddings
 */

const KnowledgeChunk = require('../../models/knowledgeChunkModel');
const { processKnowledgeBase } = require('../../services/ragService');

async function processKnowledgeController(req, res) {
    try {
        console.log("🚀 Starting knowledge base processing...");
        
        const result = await processKnowledgeBase(KnowledgeChunk);
        
        res.json({
            success: true,
            message: "Knowledge base processed successfully",
            data: result
        });
        
    } catch (error) {
        console.error("Error processing knowledge base:", error);
        res.status(500).json({
            success: false,
            message: "Failed to process knowledge base",
            error: error.message
        });
    }
}

module.exports = processKnowledgeController;
