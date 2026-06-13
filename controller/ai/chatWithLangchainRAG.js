/**
 * LangChain RAG Chat Controller
 * POST /api/ai/chat-langchain
 * Body: { query: string, sessionId?: string }
 */

const { ragChat }  = require('../../services/langchainRAGService');
const Product      = require('../../models/productModel');

async function chatWithLangchainRAG(req, res) {
    try {
        const { query, sessionId } = req.body;

        if (!query || !query.trim()) {
            return res.status(400).json({ success: false, message: 'Query is required' });
        }

        const result = await ragChat({
            query:        query.trim(),
            sessionId:    sessionId || 'default',
            ProductModel: Product,
        });

        res.json(result);
    } catch (err) {
        console.error('❌ LangChain RAG controller error:', err.message);
        res.status(500).json({
            success: false,
            message: 'AI assistant is temporarily unavailable. Please try again.',
            error:   err.message,
        });
    }
}

module.exports = chatWithLangchainRAG;
