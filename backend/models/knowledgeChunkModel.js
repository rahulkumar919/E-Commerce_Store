const mongoose = require('mongoose');

/**
 * Knowledge Chunk Schema
 * Stores text chunks with their vector embeddings for RAG system
 */
const knowledgeChunkSchema = new mongoose.Schema({
    // Product information
    category: {
        type: String,
        required: true,
        index: true
    },
    productName: {
        type: String,
        required: true,
        index: true
    },
    
    // Text content
    content: {
        type: String,
        required: true
    },
    
    // Vector embedding (768 dimensions for Gemini embedding-001)
    embedding: {
        type: [Number],
        required: true
    },
    
    // Chunk metadata
    chunkIndex: {
        type: Number,
        default: 0
    },
    
    metadata: {
        totalChunks: Number,
        processedAt: Date
    }
    
}, {
    timestamps: true
});

// Create text index for fallback search
knowledgeChunkSchema.index({ content: 'text', productName: 'text' });

// Index for faster similarity calculations
knowledgeChunkSchema.index({ category: 1, productName: 1 });

const KnowledgeChunk = mongoose.model('KnowledgeChunk', knowledgeChunkSchema);

module.exports = KnowledgeChunk;
