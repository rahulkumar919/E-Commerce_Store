/**
 * Enhanced RAG Service - Production Ready
 * Combines Pinecone Vector Search + MongoDB Product Data + Gemini AI
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Pinecone } = require('@pinecone-database/pinecone');
const fs = require('fs');
const path = require('path');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

/**
 * Generate embedding using Gemini
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
 * Parse knowledge base into structured sections
 */
function parseKnowledgeBase(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const sections = [];
    
    // Split by ## headers
    const mainSections = content.split(/\n## /).filter(s => s.trim());
    
    mainSections.forEach(section => {
        const lines = section.split('\n');
        const category = lines[0].trim();
        
        // Split by ### (products)
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
                fullText: `Product: ${productName}\nCategory: ${category}\n\n${productContent}`
            });
        });
    });
    
    return sections;
}

/**
 * Process and store knowledge base in Pinecone
 */
async function processKnowledgeBaseToPinecone() {
    try {
        console.log("🚀 Processing knowledge base to Pinecone...\n");
        
        const index = await initializePinecone();
        const knowledgeBasePath = path.join(__dirname, '../data/knowledge-base.md');
        
        console.log("📚 Parsing knowledge base...");
        const sections = parseKnowledgeBase(knowledgeBasePath);
        console.log(`✅ Found ${sections.length} product sections\n`);
        
        let processedCount = 0;
        const batchSize = 10;
        
        for (let i = 0; i < sections.length; i += batchSize) {
            const batch = sections.slice(i, i + batchSize);
            console.log(`🔄 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(sections.length / batchSize)}...`);
            
            const vectors = [];
            
            for (let j = 0; j < batch.length; j++) {
                const section = batch[j];
                
                try {
                    // Generate embedding
                    const embedding = await generateEmbedding(section.fullText);
                    
                    if (embedding && embedding.length > 0) {
                        vectors.push({
                            id: `product-${section.productName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}-${j}`,
                            values: embedding,
                            metadata: {
                                productName: section.productName,
                                category: section.category,
                                content: section.content.substring(0, 1000),
                                fullText: section.fullText.substring(0, 2000)
                            }
                        });
                    }
                    
                    // Rate limiting
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                } catch (error) {
                    console.error(`Error processing ${section.productName}:`, error.message);
                }
            }
            
            // Upsert to Pinecone
            if (vectors.length > 0) {
                await index.upsert(vectors);
                processedCount += vectors.length;
                console.log(`✅ Upserted ${vectors.length} vectors (Total: ${processedCount})\n`);
            }
        }
        
        console.log(`\n✅ Processing complete! Total: ${processedCount} vectors`);
        return { success: true, vectorsProcessed: processedCount };
        
    } catch (error) {
        console.error("❌ Error:", error);
        throw error;
    }
}

/**
 * Extract user intent from query
 */
function extractIntent(query) {
    const lowerQuery = query.toLowerCase();
    
    // Greeting intents
    const greetings = ['hi', 'hello', 'hey', 'नमस्ते', 'हेलो', 'हाय', 'good morning', 'good evening'];
    if (greetings.some(g => lowerQuery.includes(g))) {
        return 'greeting';
    }
    
    // General questions (no product needed)
    const generalQuestions = [
        'how are you', 'कैसे हो', 'what is', 'क्या है', 'tell me about', 'बताओ',
        'who are you', 'तुम कौन हो', 'your name', 'तुम्हारा नाम', 'help', 'मदद'
    ];
    if (generalQuestions.some(q => lowerQuery.includes(q))) {
        return 'conversation';
    }
    
    // Shopping related (but not health specific)
    const shopping = ['price', 'कीमत', 'delivery', 'डिलीवरी', 'order', 'ऑर्डर', 'payment', 'भुगतान'];
    if (shopping.some(s => lowerQuery.includes(s))) {
        return 'shopping';
    }
    
    // Health intents (product suggestions needed)
    const intents = {
        immunity: ['immunity', 'immune', 'बीमारी', 'सर्दी', 'जुकाम', 'cold', 'flu', 'रोग प्रतिरोधक', 'बुखार'],
        weightLoss: ['weight loss', 'वजन कम', 'मोटापा', 'fat', 'slim', 'diet', 'पतला', 'वजन घटाना'],
        energy: ['energy', 'stamina', 'ताकत', 'शक्ति', 'थकान', 'fatigue', 'workout', 'gym', 'ऊर्जा'],
        digestion: ['digestion', 'पाचन', 'constipation', 'कब्ज', 'stomach', 'पेट', 'acidity', 'gas'],
        heartHealth: ['heart', 'दिल', 'cholesterol', 'blood pressure', 'bp', 'हृदय', 'कोलेस्ट्रॉल'],
        brainHealth: ['brain', 'memory', 'याददाश्त', 'concentration', 'focus', 'दिमाग', 'मस्तिष्क'],
        skinCare: ['skin', 'त्वचा', 'glow', 'चमक', 'beauty', 'सुंदरता', 'face'],
        anemia: ['anemia', 'खून', 'hemoglobin', 'iron', 'एनीमिया', 'रक्त', 'हीमोग्लोबिन'],
        diabetes: ['diabetes', 'sugar', 'मधुमेह', 'blood sugar', 'शुगर', 'डायबिटीज'],
        boneHealth: ['bone', 'हड्डी', 'calcium', 'कैल्शियम', 'joint', 'जोड़', 'arthritis']
    };
    
    for (const [intent, keywords] of Object.entries(intents)) {
        if (keywords.some(keyword => lowerQuery.includes(keyword))) {
            return intent;
        }
    }
    
    return 'general';
}

/**
 * Search Pinecone for relevant context
 */
async function searchPinecone(query, topK = 5) {
    try {
        const index = await initializePinecone();
        
        // Generate query embedding
        const queryEmbedding = await generateEmbedding(query);
        
        // Search Pinecone
        const searchResults = await index.query({
            vector: queryEmbedding,
            topK: topK,
            includeMetadata: true
        });
        
        return searchResults.matches || [];
        
    } catch (error) {
        console.error("Pinecone search error:", error);
        return [];
    }
}

/**
 * Main RAG function - Generate response with product recommendations
 */
async function generateEnhancedRAGResponse(userQuery, Product) {
    try {
        console.log("💬 User Query:", userQuery);
        
        // Extract intent
        const intent = extractIntent(userQuery);
        console.log("🎯 Intent:", intent);
        
        // Handle conversational intents (no products needed)
        if (intent === 'greeting') {
            return {
                success: true,
                message: "नमस्ते! 🙏 मैं STM Fruit Shop का AI Assistant हूं। मैं आपकी मदद के लिए यहां हूं। आप मुझसे फलों, ड्राई फ्रूट्स, या स्वास्थ्य से जुड़े सवाल पूछ सकते हैं। कैसे मदद कर सकता हूं?",
                intent: intent,
                recommendedProducts: []
            };
        }
        
        if (intent === 'conversation') {
            const conversationalResponses = {
                'how are you': "मैं बिल्कुल ठीक हूं, धन्यवाद! 😊 मैं आपकी मदद के लिए तैयार हूं। आप मुझसे फलों, ड्राई फ्रूट्स, या स्वास्थ्य से जुड़े कोई भी सवाल पूछ सकते हैं।",
                'who are you': "मैं STM Fruit Shop का AI Assistant हूं। 🤖 मैं आपको सही फल और ड्राई फ्रूट्स चुनने में मदद करता हूं। आप मुझसे स्वास्थ्य, पोषण, या हमारे products के बारे में पूछ सकते हैं।",
                'help': "मैं आपकी कई तरह से मदद कर सकता हूं:\n\n✅ स्वास्थ्य के लिए सही फल suggest करना\n✅ Products की जानकारी देना\n✅ Delivery और payment के बारे में बताना\n✅ आपके सवालों के जवाब देना\n\nआप क्या जानना चाहते हैं?"
            };
            
            const lowerQuery = userQuery.toLowerCase();
            for (const [key, response] of Object.entries(conversationalResponses)) {
                if (lowerQuery.includes(key)) {
                    return {
                        success: true,
                        message: response,
                        intent: intent,
                        recommendedProducts: []
                    };
                }
            }
            
            return {
                success: true,
                message: "मैं STM Fruit Shop का AI Assistant हूं। मैं आपको फलों और ड्राई फ्रूट्स के बारे में जानकारी दे सकता हूं। आप मुझसे कुछ भी पूछ सकते हैं! 😊",
                intent: intent,
                recommendedProducts: []
            };
        }
        
        if (intent === 'shopping') {
            return {
                success: true,
                message: "हमारे पास ताजे फल, ड्राई फ्रूट्स, और जूस की wide variety है। 🛒\n\n📦 Delivery: Sitamarhi और आसपास के इलाकों में same-day delivery\n💳 Payment: Cash on Delivery और Online Payment दोनों available\n📞 Order: WhatsApp पर भी order कर सकते हैं\n\nक्या आप कोई specific product देखना चाहते हैं?",
                intent: intent,
                recommendedProducts: []
            };
        }
        
        // For health-related queries, search and recommend products
        console.log("🔍 Searching Pinecone...");
        let pineconeResults = [];
        try {
            pineconeResults = await searchPinecone(userQuery, 5);
            console.log(`📊 Found ${pineconeResults.length} relevant matches`);
        } catch (pineconeError) {
            console.log("⚠️ Pinecone search failed, continuing without vector search");
            console.error("Pinecone error:", pineconeError.message);
        }
        
        // Build context from Pinecone results
        let context = "";
        const productNames = new Set();
        
        if (pineconeResults.length > 0) {
            pineconeResults.forEach((match, idx) => {
                if (match.metadata) {
                    context += `\n${idx + 1}. ${match.metadata.productName}:\n${match.metadata.content}\n`;
                    productNames.add(match.metadata.productName);
                }
            });
        } else {
            context = "Searching for best products based on your needs.";
        }
        
        console.log("🔍 Searching MongoDB for products...");
        
        // Fetch actual products from MongoDB
        let products = [];
        if (productNames.size > 0) {
            const nameArray = Array.from(productNames);
            products = await Product.find({
                $or: nameArray.map(name => ({
                    productName: new RegExp(name.split(' ')[0], 'i')
                }))
            }).limit(6);
        }
        
        // If no products found, get popular products
        if (products.length === 0) {
            products = await Product.find({ 
                category: { $exists: true } 
            }).sort({ viewCount: -1 }).limit(6);
        }
        
        console.log(`✅ Found ${products.length} products in database`);
        
        // Generate AI response with error handling
        console.log("🤖 Generating AI response...");
        let aiMessage = "";
        
        try {
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            
            const prompt = `You are a friendly and helpful AI assistant for STM FRUIT SHOP in Sitamarhi, Bihar.

User Query: "${userQuery}"
Intent: ${intent}

Product Information:
${context}

Available Products: ${products.map(p => p.productName).join(', ')}

Instructions:
1. Be warm, friendly, and conversational
2. Answer in a natural, human-like way
3. Use simple Hindi-English mix (Hinglish) if query is in Hindi
4. Keep response concise (2-3 sentences maximum)
5. Recommend 2-3 products with brief reasons
6. Use emojis sparingly (1-2 max)
7. Be enthusiastic but not over the top
8. Focus on benefits, not just features

Example good responses:
- "आपकी immunity बढ़ाने के लिए Orange और Amla बहुत अच्छे हैं। इनमें Vitamin C भरपूर होता है जो आपको बीमारियों से बचाता है।"
- "Weight loss के लिए Apple और Papaya perfect हैं। ये low calorie हैं और fiber से भरपूर हैं।"

Generate a helpful, natural response:`;

            const result = await model.generateContent(prompt);
            aiMessage = result.response.text();
            
        } catch (geminiError) {
            console.log("⚠️ Gemini AI failed, using fallback response");
            console.error("Gemini error:", geminiError.message);
            
            // Fallback response based on intent
            const intentMessages = {
                immunity: "आपकी immunity बढ़ाने के लिए हमारे पास Vitamin C से भरपूर फल हैं जैसे Orange, Amla, और Kiwi। ये आपके शरीर की रोग प्रतिरोधक क्षमता को मजबूत बनाते हैं। 🍊",
                weightLoss: "Weight loss के लिए Apple, Papaya, और Watermelon बेहतरीन हैं। ये low calorie और high fiber हैं जो आपको लंबे समय तक भरा हुआ महसूस कराते हैं। 🍎",
                energy: "Energy और stamina के लिए Almonds, Dates, और Cashews perfect हैं। इनमें natural sugars और healthy fats होते हैं जो instant energy देते हैं। 🥜",
                digestion: "Digestion के लिए Papaya, Banana, और Guava बहुत अच्छे हैं। ये fiber-rich हैं और आपके पाचन तंत्र को स्वस्थ रखते हैं। 🍌",
                anemia: "Anemia के लिए Pomegranate, Dates, और Raisins बेहतरीन हैं। ये iron-rich हैं और hemoglobin level बढ़ाने में मदद करते हैं। 🍎",
                general: "हमारे पास ताजे फल, ड्राई फ्रूट्स, और जूस की wide variety है। सभी products fresh और high quality के हैं। आप browse कर सकते हैं! 🍎🍊"
            };
            
            aiMessage = intentMessages[intent] || intentMessages.general;
        }
        
        // Format product recommendations
        const productRecommendations = products.slice(0, 4).map(product => ({
            _id: product._id,
            name: product.productName,
            price: product.sellingPrice,
            image: product.productImage && product.productImage[0] ? product.productImage[0] : '',
            category: product.category,
            reason: `Perfect for ${intent.replace(/([A-Z])/g, ' $1').toLowerCase()}`
        }));
        
        console.log("✅ Response generated successfully");
        
        return {
            success: true,
            message: aiMessage,
            intent: intent,
            recommendedProducts: productRecommendations,
            relevanceScores: pineconeResults.slice(0, 3).map(m => ({
                product: m.metadata?.productName || 'Unknown',
                score: m.score?.toFixed(3) || '0'
            }))
        };
        
    } catch (error) {
        console.error("❌ RAG Error:", error);
        
        // Fallback response
        return {
            success: false,
            message: "मुझे आपकी मदद करने में खुशी होगी! कृपया अपना सवाल फिर से पूछें या हमारे उत्पादों को ब्राउज़ करें। 🍎🍊",
            intent: 'general',
            recommendedProducts: [],
            error: error.message
        };
    }
}

module.exports = {
    processKnowledgeBaseToPinecone,
    generateEnhancedRAGResponse,
    searchPinecone,
    initializePinecone
};
