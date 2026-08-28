/**
 * Professional RAG System for STM Fruit Shop
 * Built by 20-year RAG expert
 * 
 * Features:
 * - PDF parsing and chunking
 * - Semantic embeddings with Gemini
 * - Vector storage in Pinecone
 * - Intelligent context retrieval
 * - Natural language responses
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Pinecone } = require('@pinecone-database/pinecone');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize Pinecone
let pineconeClient = null;
let pineconeIndex = null;

/**
 * Initialize Pinecone connection
 */
async function initializePinecone() {
    if (!pineconeClient) {
        pineconeClient = new Pinecone({
            apiKey: process.env.PINECONE_API_KEY,
        });
        pineconeIndex = pineconeClient.index(process.env.PINECONE_INDEX_NAME);
        console.log("✅ Pinecone initialized successfully");
    }
    return pineconeIndex;
}

/**
 * Generate embedding using Gemini
 */
async function generateEmbedding(text) {
    try {
        const model = genAI.getGenerativeModel({ model: "embedding-001" });
        const result = await model.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        console.error("❌ Embedding generation error:", error.message);
        throw error;
    }
}

/**
 * Parse PDF and extract text
 */
async function parsePDF(pdfPath) {
    try {
        console.log("📄 Reading PDF from:", pdfPath);
        const dataBuffer = fs.readFileSync(pdfPath);
        const pdfData = await pdfParse(dataBuffer);
        console.log(`✅ PDF parsed successfully. Pages: ${pdfData.numpages}, Text length: ${pdfData.text.length}`);
        return pdfData.text;
    } catch (error) {
        console.error("❌ PDF parsing error:", error.message);
        throw error;
    }
}

/**
 * Intelligent text chunking with overlap
 * Ensures context is preserved across chunks
 */
function intelligentChunking(text, chunkSize = 800, overlap = 200) {
    const chunks = [];
    
    // Clean and normalize text
    const cleanText = text
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();
    
    // Split by paragraphs first
    const paragraphs = cleanText.split(/\n\n+/);
    
    let currentChunk = '';
    let chunkIndex = 0;
    
    for (const paragraph of paragraphs) {
        // If adding this paragraph exceeds chunk size
        if ((currentChunk + paragraph).length > chunkSize && currentChunk.length > 0) {
            chunks.push({
                id: `chunk-${chunkIndex}`,
                text: currentChunk.trim(),
                index: chunkIndex
            });
            
            // Keep overlap from previous chunk
            const words = currentChunk.split(' ');
            const overlapWords = words.slice(-Math.floor(overlap / 5));
            currentChunk = overlapWords.join(' ') + ' ' + paragraph;
            chunkIndex++;
        } else {
            currentChunk += (currentChunk ? '\n\n' : '') + paragraph;
        }
    }
    
    // Add the last chunk
    if (currentChunk.trim()) {
        chunks.push({
            id: `chunk-${chunkIndex}`,
            text: currentChunk.trim(),
            index: chunkIndex
        });
    }
    
    console.log(`✅ Created ${chunks.length} intelligent chunks`);
    return chunks;
}

/**
 * Process PDF and store in Pinecone
 */
async function processPDFToPinecone(pdfPath) {
    try {
        console.log("\n🚀 Starting Professional RAG Processing...\n");
        
        // Initialize Pinecone
        const index = await initializePinecone();
        
        // Parse PDF
        const pdfText = await parsePDF(pdfPath);
        
        // Create intelligent chunks
        console.log("🔪 Creating intelligent chunks...");
        const chunks = intelligentChunking(pdfText, 800, 200);
        
        // Process chunks in batches
        const batchSize = 10;
        let processedCount = 0;
        const vectors = [];
        
        console.log(`\n📊 Processing ${chunks.length} chunks in batches of ${batchSize}...\n`);
        
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            
            try {
                console.log(`🔄 Processing chunk ${i + 1}/${chunks.length}...`);
                
                // Generate embedding
                const embedding = await generateEmbedding(chunk.text);
                
                if (embedding && embedding.length > 0) {
                    vectors.push({
                        id: `pdf-chunk-${Date.now()}-${i}`,
                        values: embedding,
                        metadata: {
                            text: chunk.text.substring(0, 2000), // Pinecone metadata limit
                            chunkIndex: i,
                            source: 'ragdata.pdf',
                            type: 'fruit_knowledge',
                            timestamp: new Date().toISOString()
                        }
                    });
                    
                    processedCount++;
                }
                
                // Upsert in batches
                if (vectors.length >= batchSize || i === chunks.length - 1) {
                    if (vectors.length > 0) {
                        console.log(`📤 Upserting batch of ${vectors.length} vectors to Pinecone...`);
                        await index.upsert(vectors);
                        console.log(`✅ Batch upserted successfully (Total: ${processedCount}/${chunks.length})\n`);
                        vectors.length = 0; // Clear array
                    }
                }
                
                // Rate limiting - wait 1 second between requests
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`❌ Error processing chunk ${i}:`, error.message);
            }
        }
        
        console.log(`\n✅ RAG Processing Complete!`);
        console.log(`📊 Total chunks processed: ${processedCount}/${chunks.length}`);
        console.log(`🎯 Success rate: ${((processedCount / chunks.length) * 100).toFixed(2)}%\n`);
        
        return {
            success: true,
            totalChunks: chunks.length,
            processedChunks: processedCount,
            message: "PDF successfully processed and stored in Pinecone"
        };
        
    } catch (error) {
        console.error("❌ RAG Processing Error:", error);
        throw error;
    }
}

/**
 * Search Pinecone for relevant context
 */
async function searchRelevantContext(query, topK = 5) {
    try {
        // Check if Pinecone is configured
        if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX_NAME) {
            console.log("⚠️ Pinecone not configured, skipping vector search");
            return [];
        }

        const index = await initializePinecone();
        
        // Generate query embedding
        console.log("🔍 Generating query embedding...");
        const queryEmbedding = await generateEmbedding(query);
        
        // Search Pinecone
        console.log(`🔎 Searching Pinecone for top ${topK} matches...`);
        const searchResults = await index.query({
            vector: queryEmbedding,
            topK: topK,
            includeMetadata: true
        });
        
        console.log(`✅ Found ${searchResults.matches?.length || 0} relevant matches`);
        
        return searchResults.matches || [];
        
    } catch (error) {
        console.error("❌ Search error:", error.message);
        console.log("⚠️ Continuing without vector search...");
        return [];
    }
}

/**
 * Extract user intent from query
 */
function extractIntent(query) {
    const lowerQuery = query.toLowerCase();
    
    // Greeting intents
    const greetings = ['hi', 'hello', 'hey', 'नमस्ते', 'हेलो', 'हाय', 'good morning', 'good evening', 'namaste'];
    if (greetings.some(g => lowerQuery.includes(g))) {
        return 'greeting';
    }
    
    // General conversation
    const conversational = ['how are you', 'कैसे हो', 'who are you', 'तुम कौन हो', 'your name', 'help', 'मदद'];
    if (conversational.some(c => lowerQuery.includes(c))) {
        return 'conversation';
    }
    
    // Shopping related
    const shopping = ['price', 'कीमत', 'delivery', 'डिलीवरी', 'order', 'ऑर्डर', 'payment', 'buy', 'खरीदना'];
    if (shopping.some(s => lowerQuery.includes(s))) {
        return 'shopping';
    }
    
    // Health benefits
    const health = [
        'benefit', 'फायदे', 'health', 'स्वास्थ्य', 'immunity', 'रोग प्रतिरोधक',
        'weight loss', 'वजन', 'energy', 'ताकत', 'digestion', 'पाचन',
        'vitamin', 'विटामिन', 'protein', 'प्रोटीन', 'nutrition', 'पोषण'
    ];
    if (health.some(h => lowerQuery.includes(h))) {
        return 'health_benefits';
    }
    
    // Product information
    const productInfo = ['what is', 'क्या है', 'tell me about', 'बताओ', 'information', 'जानकारी'];
    if (productInfo.some(p => lowerQuery.includes(p))) {
        return 'product_info';
    }
    
    return 'general_query';
}

/**
 * Generate intelligent response using RAG
 */
async function generateRAGResponse(userQuery, Product) {
    try {
        console.log("\n💬 User Query:", userQuery);
        
        // Extract intent
        const intent = extractIntent(userQuery);
        console.log("🎯 Detected Intent:", intent);
        
        // Handle conversational intents without RAG
        if (intent === 'greeting') {
            return {
                success: true,
                message: "नमस्ते! 🙏 मैं STM Fruit Shop का AI Assistant हूं। मैं आपको फलों और ड्राई फ्रूट्स के बारे में विस्तार से बता सकता हूं। आप मुझसे कुछ भी पूछ सकते हैं!",
                intent: intent,
                recommendedProducts: []
            };
        }
        
        if (intent === 'conversation') {
            return {
                success: true,
                message: "मैं STM Fruit Shop का AI Assistant हूं। 🤖 मैं फलों, ड्राई फ्रूट्स, और उनके स्वास्थ्य लाभों के बारे में expert हूं। आप मुझसे किसी भी फल या ड्राई फ्रूट के बारे में पूछ सकते हैं!",
                intent: intent,
                recommendedProducts: []
            };
        }
        
        if (intent === 'shopping') {
            return {
                success: true,
                message: "हमारे पास ताजे फल, premium ड्राई फ्रूट्स, और healthy जूस की wide variety है। 🛒\n\n📦 Delivery: Sitamarhi और nearby areas में same-day delivery\n💳 Payment: Cash on Delivery और Online Payment\n📞 Order: WhatsApp पर भी order कर सकते हैं\n\nक्या आप कोई specific product देखना चाहते हैं?",
                intent: intent,
                recommendedProducts: []
            };
        }
        
        // For knowledge-based queries, use RAG
        console.log("🔍 Searching vector database for relevant context...");
        let relevantMatches = [];
        
        try {
            relevantMatches = await searchRelevantContext(userQuery, 5);
        } catch (searchError) {
            console.log("⚠️ Vector search failed, continuing without context:", searchError.message);
        }
        
        // Build context from matches
        let context = "";
        if (relevantMatches.length > 0) {
            console.log(`📚 Building context from ${relevantMatches.length} matches...`);
            relevantMatches.forEach((match, idx) => {
                if (match.metadata && match.metadata.text) {
                    context += `\n[Context ${idx + 1}] (Relevance: ${(match.score * 100).toFixed(1)}%)\n${match.metadata.text}\n`;
                }
            });
        } else {
            console.log("⚠️ No relevant context found in vector database");
            context = "General fruit and dry fruit knowledge from STM Fruit Shop.";
        }
        
        // Search MongoDB for related products
        console.log("🔍 Searching MongoDB for related products...");
        const searchTerms = userQuery.toLowerCase().split(' ').filter(word => word.length > 3);
        let products = [];
        
        if (searchTerms.length > 0) {
            products = await Product.find({
                $or: [
                    { productName: { $regex: searchTerms.join('|'), $options: 'i' } },
                    { category: { $regex: searchTerms.join('|'), $options: 'i' } },
                    { description: { $regex: searchTerms.join('|'), $options: 'i' } }
                ]
            }).limit(6);
        }
        
        // If no products found, get popular ones
        if (products.length === 0) {
            products = await Product.find({}).sort({ viewCount: -1 }).limit(4);
        }
        
        console.log(`✅ Found ${products.length} related products`);
        
        // Generate AI response
        console.log("🤖 Generating AI response with Gemini...");
        let aiMessage = "";
        
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            
            const prompt = `You are an expert AI assistant for STM FRUIT SHOP in Sitamarhi, Bihar. You have deep knowledge about fruits, dry fruits, and their health benefits.

User Query: "${userQuery}"
Intent: ${intent}

Relevant Context from Knowledge Base:
${context}

Available Products: ${products.map(p => p.productName).join(', ')}

Instructions:
1. Answer in a warm, friendly, and conversational tone
2. Use Hindi-English mix (Hinglish) naturally
3. Be specific and informative based on the context provided
4. Keep response concise (3-4 sentences maximum)
5. If recommending products, explain WHY they're good for the user's query
6. Use emojis sparingly (1-2 max)
7. Be enthusiastic but professional
8. Focus on health benefits and nutritional value

IMPORTANT:
- Use the context provided above to give accurate information
- Don't make up information not in the context
- If context doesn't have specific info, give general helpful advice
- Always relate your answer to the user's specific question

Generate a helpful, accurate, and natural response:`;

            const result = await model.generateContent(prompt);
            aiMessage = result.response.text();
            console.log("✅ AI response generated successfully");
            
        } catch (geminiError) {
            console.log("⚠️ Gemini AI failed, using fallback response");
            console.error("Gemini error:", geminiError.message);
            
            // Intelligent fallback based on context
            if (relevantMatches.length > 0 && relevantMatches[0].metadata) {
                const topMatch = relevantMatches[0].metadata.text;
                const summary = topMatch.substring(0, 300);
                aiMessage = `${summary}...\n\nयह जानकारी हमारे knowledge base से है। अधिक जानकारी के लिए आप specific सवाल पूछ सकते हैं! 😊`;
            } else {
                aiMessage = "मुझे आपकी query के बारे में specific जानकारी नहीं मिली। कृपया अपना सवाल थोड़ा अलग तरीके से पूछें या हमारे products browse करें! 🍎🍊";
            }
        }
        
        // Format product recommendations
        const productRecommendations = products.slice(0, 4).map(product => ({
            _id: product._id,
            name: product.productName,
            price: product.sellingPrice,
            image: product.productImage && product.productImage[0] ? product.productImage[0] : '',
            category: product.category,
            reason: `Recommended based on your query`
        }));
        
        console.log("✅ Response generation complete\n");
        
        return {
            success: true,
            message: aiMessage,
            intent: intent,
            recommendedProducts: productRecommendations,
            contextUsed: relevantMatches.length > 0,
            relevanceScores: relevantMatches.slice(0, 3).map(m => ({
                score: (m.score * 100).toFixed(1) + '%',
                preview: m.metadata?.text?.substring(0, 100) + '...'
            }))
        };
        
    } catch (error) {
        console.error("❌ RAG Response Error:", error);
        
        return {
            success: false,
            message: "मुझे आपकी मदद करने में खुशी होगी! कृपया अपना सवाल फिर से पूछें। 🍎",
            intent: 'error',
            recommendedProducts: [],
            error: error.message
        };
    }
}

module.exports = {
    processPDFToPinecone,
    generateRAGResponse,
    searchRelevantContext,
    initializePinecone
};
