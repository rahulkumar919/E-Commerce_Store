/**
 * RAG (Retrieval-Augmented Generation) Service
 * 
 * This service handles:
 * 1. Document chunking
 * 2. Embedding generation using Gemini
 * 3. Vector storage in MongoDB
 * 4. Semantic search
 * 5. Context-aware response generation
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * STEP 1: CHUNK TEXT INTO SMALLER PIECES
 * Why? Large documents need to be split for better retrieval
 */
function chunkText(text, chunkSize = 500, overlap = 50) {
    const chunks = [];
    const words = text.split(/\s+/);
    
    for (let i = 0; i < words.length; i += (chunkSize - overlap)) {
        const chunk = words.slice(i, i + chunkSize).join(' ');
        if (chunk.trim()) {
            chunks.push(chunk.trim());
        }
    }
    
    return chunks;
}

/**
 * STEP 2: PARSE MARKDOWN KNOWLEDGE BASE
 * Extracts structured data from markdown
 */
function parseKnowledgeBase(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const sections = [];
    
    // Split by ## headers (product sections)
    const productSections = content.split(/\n## /).filter(s => s.trim());
    
    productSections.forEach(section => {
        const lines = section.split('\n');
        const category = lines[0].trim();
        
        // Split by ### (individual products)
        const products = section.split(/\n### /).filter(p => p.trim());
        
        products.forEach((product, idx) => {
            if (idx === 0) return; // Skip category header
            
            const productLines = product.split('\n');
            const productName = productLines[0].trim();
            const productContent = productLines.slice(1).join('\n');
            
            sections.push({
                category,
                productName,
                content: productContent,
                fullText: `${category} - ${productName}\n${productContent}`
            });
        });
    });
    
    return sections;
}

/**
 * STEP 3: GENERATE EMBEDDINGS USING GEMINI
 * Converts text to vector representation
 */
async function generateEmbedding(text) {
    try {
        const model = genAI.getGenerativeModel({ model: "embedding-001" });
        const result = await model.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        console.error("Error generating embedding:", error);
        throw error;
    }
}

/**
 * STEP 4: PROCESS AND STORE KNOWLEDGE BASE
 * Main function to process entire knowledge base
 */
async function processKnowledgeBase(KnowledgeChunk) {
    try {
        const knowledgeBasePath = path.join(__dirname, '../data/knowledge-base.md');
        
        console.log("📚 Parsing knowledge base...");
        const sections = parseKnowledgeBase(knowledgeBasePath);
        
        console.log(`✅ Found ${sections.length} product sections`);
        
        // Clear existing chunks
        await KnowledgeChunk.deleteMany({});
        console.log("🗑️  Cleared old embeddings");
        
        let processedCount = 0;
        
        for (const section of sections) {
            // Chunk the content
            const chunks = chunkText(section.fullText, 400, 50);
            
            for (let i = 0; i < chunks.length; i++) {
                const chunkText = chunks[i];
                
                // Generate embedding
                console.log(`🔄 Processing: ${section.productName} (chunk ${i + 1}/${chunks.length})`);
                const embedding = await generateEmbedding(chunkText);
                
                // Store in MongoDB
                await KnowledgeChunk.create({
                    category: section.category,
                    productName: section.productName,
                    content: chunkText,
                    embedding: embedding,
                    chunkIndex: i,
                    metadata: {
                        totalChunks: chunks.length,
                        processedAt: new Date()
                    }
                });
                
                processedCount++;
                
                // Rate limiting - wait 1 second between requests
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        
        console.log(`✅ Successfully processed ${processedCount} chunks`);
        return { success: true, chunksProcessed: processedCount };
        
    } catch (error) {
        console.error("❌ Error processing knowledge base:", error);
        throw error;
    }
}

/**
 * STEP 5: SEMANTIC SEARCH
 * Find most relevant chunks based on query
 */
async function semanticSearch(query, KnowledgeChunk, topK = 5) {
    try {
        // Generate embedding for query
        const queryEmbedding = await generateEmbedding(query);
        
        // MongoDB vector search using aggregation
        const results = await KnowledgeChunk.aggregate([
            {
                $addFields: {
                    similarity: {
                        $reduce: {
                            input: { $range: [0, { $size: "$embedding" }] },
                            initialValue: 0,
                            in: {
                                $add: [
                                    "$$value",
                                    {
                                        $multiply: [
                                            { $arrayElemAt: ["$embedding", "$$this"] },
                                            { $arrayElemAt: [queryEmbedding, "$$this"] }
                                        ]
                                    }
                                ]
                            }
                        }
                    }
                }
            },
            { $sort: { similarity: -1 } },
            { $limit: topK },
            {
                $project: {
                    category: 1,
                    productName: 1,
                    content: 1,
                    similarity: 1,
                    _id: 0
                }
            }
        ]);
        
        return results;
        
    } catch (error) {
        console.error("Error in semantic search:", error);
        throw error;
    }
}

/**
 * STEP 6: EXTRACT INTENT FROM QUERY
 * Understand what user is asking for
 */
function extractIntent(query) {
    const lowerQuery = query.toLowerCase();
    
    const intents = {
        immunity: ['immunity', 'immune', 'बीमारी', 'सर्दी', 'जुकाम', 'cold', 'flu'],
        weightLoss: ['weight loss', 'वजन कम', 'मोटापा', 'fat', 'slim', 'diet'],
        energy: ['energy', 'stamina', 'ताकत', 'शक्ति', 'थकान', 'fatigue', 'workout'],
        digestion: ['digestion', 'पाचन', 'constipation', 'कब्ज', 'stomach', 'पेट'],
        heartHealth: ['heart', 'दिल', 'cholesterol', 'blood pressure', 'bp'],
        brainHealth: ['brain', 'memory', 'याददाश्त', 'concentration', 'focus'],
        skinCare: ['skin', 'त्वचा', 'glow', 'चमक', 'beauty'],
        anemia: ['anemia', 'खून', 'hemoglobin', 'iron', 'एनीमिया'],
        diabetes: ['diabetes', 'sugar', 'मधुमेह', 'blood sugar'],
        boneHealth: ['bone', 'हड्डी', 'calcium', 'कैल्शियम']
    };
    
    for (const [intent, keywords] of Object.entries(intents)) {
        if (keywords.some(keyword => lowerQuery.includes(keyword))) {
            return intent;
        }
    }
    
    return 'general';
}

/**
 * STEP 7: GENERATE AI RESPONSE WITH PRODUCT RECOMMENDATIONS
 * Main RAG function
 */
async function generateRAGResponse(userQuery, KnowledgeChunk, Product) {
    try {
        console.log("🔍 User Query:", userQuery);
        
        // Extract intent
        const intent = extractIntent(userQuery);
        console.log("🎯 Detected Intent:", intent);
        
        // Perform semantic search
        const relevantChunks = await semanticSearch(userQuery, KnowledgeChunk, 5);
        console.log(`📊 Found ${relevantChunks.length} relevant chunks`);
        
        // Build context from retrieved chunks
        const context = relevantChunks
            .map(chunk => `${chunk.productName}:\n${chunk.content}`)
            .join('\n\n---\n\n');
        
        // Extract product names from chunks
        const recommendedProductNames = [...new Set(
            relevantChunks.map(chunk => chunk.productName)
        )];
        
        // Fetch actual products from database
        const products = await Product.find({
            productName: { 
                $in: recommendedProductNames.map(name => new RegExp(name, 'i'))
            }
        }).limit(6);
        
        // Generate AI response using Gemini
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        
        const prompt = `You are a helpful AI assistant for STM FRUIT SHOP, an online fruit and dry fruit store in Sitamarhi, Bihar.

User Query: "${userQuery}"
Detected Intent: ${intent}

Relevant Product Information:
${context}

Instructions:
1. Answer the user's question in a friendly, conversational tone
2. Recommend 3-4 specific products based on their needs
3. Explain WHY each product is beneficial for their specific use case
4. Keep the response concise (3-4 sentences max)
5. Use simple Hindi-English mix if appropriate
6. Be enthusiastic and helpful

Response:`;

        const result = await model.generateContent(prompt);
        const aiMessage = result.response.text();
        
        // Format product recommendations
        const productRecommendations = products.map(product => ({
            _id: product._id,
            name: product.productName,
            price: product.sellingPrice,
            image: product.productImage[0],
            category: product.category,
            reason: `Perfect for ${intent.replace(/([A-Z])/g, ' $1').toLowerCase()}`
        }));
        
        return {
            success: true,
            message: aiMessage,
            intent: intent,
            recommendedProducts: productRecommendations,
            context: relevantChunks.map(c => ({
                product: c.productName,
                category: c.category,
                similarity: c.similarity
            }))
        };
        
    } catch (error) {
        console.error("❌ Error generating RAG response:", error);
        throw error;
    }
}

module.exports = {
    processKnowledgeBase,
    generateRAGResponse,
    semanticSearch,
    generateEmbedding
};
