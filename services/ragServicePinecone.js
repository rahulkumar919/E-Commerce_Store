/**
 * Enhanced RAG Service with Pinecone + LangChain
 * 
 * Features:
 * - Pinecone vector database for better performance
 * - LangChain for better orchestration
 * - Improved chunking and retrieval
 * - Better context management
 */

const { Pinecone } = require('@pinecone-database/pinecone');
const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
const { GoogleGenerativeAIEmbeddings } = require('@langchain/google-genai');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { PromptTemplate } = require('@langchain/core/prompts');
const fs = require('fs');
const path = require('path');

// Initialize Pinecone
let pineconeClient = null;
let pineconeIndex = null;

async function initializePinecone() {
    if (!pineconeClient) {
        pineconeClient = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        });
        
        pineconeIndex = pineconeClient.index(process.env.PINECONE_INDEX_NAME);
        console.log("✅ Pinecone initialized");
    }
    return pineconeIndex;
}

// Initialize embeddings model
const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    model: "embedding-001",
});

// Initialize LLM
const llm = new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    model: "gemini-pro",
    temperature: 0.7,
});

/**
 * STEP 1: PARSE KNOWLEDGE BASE
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
                fullText: `Category: ${category}\nProduct: ${productName}\n\n${productContent}`
            });
        });
    });
    
    return sections;
}

/**
 * STEP 2: CHUNK TEXT USING LANGCHAIN
 */
async function chunkDocuments(sections) {
    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 500,
        chunkOverlap: 100,
        separators: ["\n\n", "\n", ". ", " ", ""],
    });
    
    const allChunks = [];
    
    for (const section of sections) {
        const chunks = await textSplitter.createDocuments(
            [section.fullText],
            [{
                category: section.category,
                productName: section.productName,
                source: 'knowledge-base'
            }]
        );
        
        allChunks.push(...chunks);
    }
    
    return allChunks;
}

/**
 * STEP 3: PROCESS AND STORE IN PINECONE
 */
async function processKnowledgeBaseToPinecone() {
    try {
        console.log("🚀 Starting Pinecone knowledge base processing...\n");
        
        // Initialize Pinecone
        const index = await initializePinecone();
        
        // Parse knowledge base
        const knowledgeBasePath = path.join(__dirname, '../data/knowledge-base.md');
        console.log("📚 Parsing knowledge base...");
        const sections = parseKnowledgeBase(knowledgeBasePath);
        console.log(`✅ Found ${sections.length} product sections\n`);
        
        // Chunk documents
        console.log("✂️  Chunking documents...");
        const chunks = await chunkDocuments(sections);
        console.log(`✅ Created ${chunks.length} chunks\n`);
        
        // Skip delete - just upsert (will overwrite existing)
        console.log("📤 Upserting vectors to Pinecone...\n");
        
        // Process in batches
        const batchSize = 100;
        let processedCount = 0;
        
        for (let i = 0; i < chunks.length; i += batchSize) {
            const batch = chunks.slice(i, i + batchSize);
            
            console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}...`);
            
            // Generate embeddings for batch
            const texts = batch.map(chunk => chunk.pageContent);
            
            console.log(`   Generating embeddings for ${texts.length} chunks...`);
            const embeddingResults = await embeddings.embedDocuments(texts);
            console.log(`   ✅ Generated ${embeddingResults.length} embeddings`);
            
            // Prepare vectors for Pinecone
            const vectors = [];
            for (let idx = 0; idx < batch.length; idx++) {
                const chunk = batch[idx];
                const embedding = embeddingResults[idx];
                
                if (embedding && embedding.length > 0) {
                    vectors.push({
                        id: `chunk-${Date.now()}-${i + idx}`,
                        values: embedding,
                        metadata: {
                            text: chunk.pageContent.substring(0, 1000), // Limit metadata size
                            category: chunk.metadata.category || 'unknown',
                            productName: chunk.metadata.productName || 'unknown',
                            source: chunk.metadata.source || 'knowledge-base',
                        }
                    });
                }
            }
            
            console.log(`   Prepared ${vectors.length} vectors`);
            
            // Upsert to Pinecone
            if (vectors.length > 0) {
                console.log(`   Upserting ${vectors.length} vectors to Pinecone...`);
                await index.upsert(vectors);
                console.log(`   ✅ Upserted successfully`);
            } else {
                console.log(`   ⚠️  No valid vectors to upsert`);
            }
            
            processedCount += batch.length;
            console.log(`✅ Processed ${processedCount}/${chunks.length} chunks\n`);
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        console.log("\n✅ Knowledge base processing complete!");
        console.log(`📊 Total chunks processed: ${processedCount}`);
        
        return { success: true, chunksProcessed: processedCount };
        
    } catch (error) {
        console.error("❌ Error processing knowledge base:", error);
        throw error;
    }
}

/**
 * STEP 4: EXTRACT INTENT
 */
function extractIntent(query) {
    const lowerQuery = query.toLowerCase();
    
    const intents = {
        immunity: ['immunity', 'immune', 'बीमारी', 'सर्दी', 'जुकाम', 'cold', 'flu', 'रोग प्रतिरोधक'],
        weightLoss: ['weight loss', 'वजन कम', 'मोटापा', 'fat', 'slim', 'diet', 'पतला'],
        energy: ['energy', 'stamina', 'ताकत', 'शक्ति', 'थकान', 'fatigue', 'workout', 'gym'],
        digestion: ['digestion', 'पाचन', 'constipation', 'कब्ज', 'stomach', 'पेट', 'acidity'],
        heartHealth: ['heart', 'दिल', 'cholesterol', 'blood pressure', 'bp', 'हृदय'],
        brainHealth: ['brain', 'memory', 'याददाश्त', 'concentration', 'focus', 'दिमाग'],
        skinCare: ['skin', 'त्वचा', 'glow', 'चमक', 'beauty', 'सुंदरता'],
        anemia: ['anemia', 'खून', 'hemoglobin', 'iron', 'एनीमिया', 'रक्त'],
        diabetes: ['diabetes', 'sugar', 'मधुमेह', 'blood sugar', 'शुगर'],
        boneHealth: ['bone', 'हड्डी', 'calcium', 'कैल्शियम', 'joint', 'जोड़']
    };
    
    for (const [intent, keywords] of Object.entries(intents)) {
        if (keywords.some(keyword => lowerQuery.includes(keyword))) {
            return intent;
        }
    }
    
    return 'general';
}

/**
 * STEP 5: SEMANTIC SEARCH IN PINECONE
 */
async function semanticSearchPinecone(query, topK = 5) {
    try {
        const index = await initializePinecone();
        
        // Generate query embedding
        const queryEmbedding = await embeddings.embedQuery(query);
        
        // Search in Pinecone
        const searchResults = await index.query({
            vector: queryEmbedding,
            topK: topK,
            includeMetadata: true,
        });
        
        return searchResults.matches.map(match => ({
            text: match.metadata.text,
            category: match.metadata.category,
            productName: match.metadata.productName,
            score: match.score,
        }));
        
    } catch (error) {
        console.error("Error in semantic search:", error);
        throw error;
    }
}

/**
 * STEP 6: GENERATE AI RESPONSE WITH LANGCHAIN
 */
async function generateRAGResponsePinecone(userQuery, Product) {
    try {
        console.log("🔍 User Query:", userQuery);
        
        // Extract intent
        const intent = extractIntent(userQuery);
        console.log("🎯 Detected Intent:", intent);
        
        // Perform semantic search
        const relevantChunks = await semanticSearchPinecone(userQuery, 5);
        console.log(`📊 Found ${relevantChunks.length} relevant chunks`);
        
        // Build context
        const context = relevantChunks
            .map(chunk => `${chunk.productName}:\n${chunk.text}`)
            .join('\n\n---\n\n');
        
        // Extract product names
        const recommendedProductNames = [...new Set(
            relevantChunks.map(chunk => chunk.productName)
        )];
        
        // Fetch actual products from database
        const products = await Product.find({
            productName: { 
                $in: recommendedProductNames.map(name => new RegExp(name, 'i'))
            }
        }).limit(6);
        
        // Create prompt template
        const promptTemplate = PromptTemplate.fromTemplate(`
You are a helpful AI assistant for STM FRUIT SHOP, an online fruit and dry fruit store in Sitamarhi, Bihar.

User Query: "{query}"
Detected Intent: {intent}

Relevant Product Information:
{context}

Instructions:
1. Answer the user's question in a friendly, conversational tone
2. Recommend 3-4 specific products based on their needs
3. Explain WHY each product is beneficial for their specific use case
4. Keep the response concise (3-4 sentences max)
5. Use simple Hindi-English mix if the query is in Hindi
6. Be enthusiastic and helpful
7. Focus on health benefits and practical usage

Response:`);
        
        // Generate response
        const formattedPrompt = await promptTemplate.format({
            query: userQuery,
            intent: intent,
            context: context
        });
        
        const response = await llm.invoke(formattedPrompt);
        const aiMessage = response.content;
        
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
            relevanceScores: relevantChunks.map(c => ({
                product: c.productName,
                score: c.score.toFixed(3)
            }))
        };
        
    } catch (error) {
        console.error("❌ Error generating RAG response:", error);
        throw error;
    }
}

/**
 * STEP 7: CONVERSATIONAL MEMORY (OPTIONAL)
 */
class ConversationMemory {
    constructor() {
        this.conversations = new Map();
    }
    
    addMessage(userId, role, content) {
        if (!this.conversations.has(userId)) {
            this.conversations.set(userId, []);
        }
        
        this.conversations.get(userId).push({
            role,
            content,
            timestamp: new Date()
        });
        
        // Keep only last 10 messages
        const messages = this.conversations.get(userId);
        if (messages.length > 10) {
            this.conversations.set(userId, messages.slice(-10));
        }
    }
    
    getHistory(userId) {
        return this.conversations.get(userId) || [];
    }
    
    clear(userId) {
        this.conversations.delete(userId);
    }
}

const conversationMemory = new ConversationMemory();

module.exports = {
    processKnowledgeBaseToPinecone,
    generateRAGResponsePinecone,
    semanticSearchPinecone,
    initializePinecone,
    conversationMemory
};
