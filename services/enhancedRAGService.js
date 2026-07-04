/**
 * Enhanced RAG Service - Production Ready
 * Combines Pinecone Vector Search + MongoDB Product Data + Gemini AI
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Pinecone } = require("@pinecone-database/pinecone");
const fs = require("fs");
const path = require("path");

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
  const content = fs.readFileSync(filePath, "utf-8");
  const sections = [];

  // Split by ## headers
  const mainSections = content.split(/\n## /).filter((s) => s.trim());

  mainSections.forEach((section) => {
    const lines = section.split("\n");
    const category = lines[0].trim();

    // Split by ### (products)
    const products = section.split(/\n### /).filter((p) => p.trim());

    products.forEach((product, idx) => {
      if (idx === 0) return; // Skip category header

      const productLines = product.split("\n");
      const productName = productLines[0].trim();
      const productContent = productLines.slice(1).join("\n");

      sections.push({
        category,
        productName,
        content: productContent,
        fullText: `Product: ${productName}\nCategory: ${category}\n\n${productContent}`,
      });
    });
  });

  return sections;
}

/**
 * Chunk plain text into overlapping segments for better retrieval
 */
function chunkText(text, chunkSize = 250, overlap = 50) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];

  for (let start = 0; start < words.length; start += chunkSize - overlap) {
    const chunk = words.slice(start, start + chunkSize).join(" ");
    if (chunk.trim()) {
      chunks.push(chunk.trim());
    }
    if (start + chunkSize >= words.length) break;
  }

  return chunks;
}

/**
 * Process and store knowledge base in Pinecone
 */
async function processKnowledgeBaseToPinecone() {
  try {
    console.log("🚀 Processing knowledge base to Pinecone...\n");

    const index = await initializePinecone();
    const knowledgeBasePath = path.join(__dirname, "../data/knowledge-base.md");

    console.log("📚 Parsing knowledge base...");
    const sections = parseKnowledgeBase(knowledgeBasePath);
    console.log(`✅ Found ${sections.length} product sections\n`);

    let processedCount = 0;
    const batchSize = 50;
    let batchVectors = [];

    for (const section of sections) {
      const chunks = chunkText(section.fullText, 250, 50);

      for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
        const chunk = chunks[chunkIndex];

        try {
          const embedding = await generateEmbedding(chunk);

          if (embedding && embedding.length > 0) {
            batchVectors.push({
              id: `kb-${section.productName.toLowerCase().replace(/\s+/g, "-")}-${chunkIndex}-${Date.now()}`,
              values: embedding,
              metadata: {
                productName: section.productName,
                category: section.category,
                text: chunk.substring(0, 1500),
                source: "knowledge-base",
              },
            });
          }
        } catch (error) {
          console.error(
            `Error creating embedding for ${section.productName}:`,
            error.message,
          );
        }

        if (batchVectors.length >= batchSize) {
          await index.upsert({ vectors: batchVectors });
          processedCount += batchVectors.length;
          console.log(
            `✅ Upserted ${batchVectors.length} vectors (Total: ${processedCount})`,
          );
          batchVectors = [];
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    if (batchVectors.length > 0) {
      await index.upsert({ vectors: batchVectors });
      processedCount += batchVectors.length;
      console.log(
        `✅ Upserted ${batchVectors.length} vectors (Total: ${processedCount})`,
      );
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
  const greetings = [
    "hi",
    "hello",
    "hey",
    "नमस्ते",
    "हेलो",
    "हाय",
    "good morning",
    "good evening",
  ];
  if (greetings.some((g) => lowerQuery.includes(g))) {
    return "greeting";
  }

  // General questions (no product needed)
  const generalQuestions = [
    "how are you",
    "कैसे हो",
    "what is",
    "क्या है",
    "tell me about",
    "बताओ",
    "who are you",
    "तुम कौन हो",
    "your name",
    "तुम्हारा नाम",
    "help",
    "मदद",
  ];
  if (generalQuestions.some((q) => lowerQuery.includes(q))) {
    return "conversation";
  }

  // Shopping related (but not health specific)
  const shopping = [
    "price",
    "कीमत",
    "delivery",
    "डिलीवरी",
    "order",
    "ऑर्डर",
    "payment",
    "भुगतान",
  ];
  if (shopping.some((s) => lowerQuery.includes(s))) {
    return "shopping";
  }

  // Health intents (product suggestions needed)
  const intents = {
    immunity: [
      "immunity",
      "immune",
      "बीमारी",
      "सर्दी",
      "जुकाम",
      "cold",
      "flu",
      "रोग प्रतिरोधक",
      "बुखार",
    ],
    weightLoss: [
      "weight loss",
      "वजन कम",
      "मोटापा",
      "fat",
      "slim",
      "diet",
      "पतला",
      "वजन घटाना",
    ],
    energy: [
      "energy",
      "stamina",
      "ताकत",
      "शक्ति",
      "थकान",
      "fatigue",
      "workout",
      "gym",
      "ऊर्जा",
    ],
    digestion: [
      "digestion",
      "पाचन",
      "constipation",
      "कब्ज",
      "stomach",
      "पेट",
      "acidity",
      "gas",
    ],
    heartHealth: [
      "heart",
      "दिल",
      "cholesterol",
      "blood pressure",
      "bp",
      "हृदय",
      "कोलेस्ट्रॉल",
    ],
    brainHealth: [
      "brain",
      "memory",
      "याददाश्त",
      "concentration",
      "focus",
      "दिमाग",
      "मस्तिष्क",
    ],
    skinCare: ["skin", "त्वचा", "glow", "चमक", "beauty", "सुंदरता", "face"],
    anemia: [
      "anemia",
      "खून",
      "hemoglobin",
      "iron",
      "एनीमिया",
      "रक्त",
      "हीमोग्लोबिन",
    ],
    diabetes: [
      "diabetes",
      "sugar",
      "मधुमेह",
      "blood sugar",
      "शुगर",
      "डायबिटीज",
    ],
    boneHealth: [
      "bone",
      "हड्डी",
      "calcium",
      "कैल्शियम",
      "joint",
      "जोड़",
      "arthritis",
    ],
  };

  for (const [intent, keywords] of Object.entries(intents)) {
    if (keywords.some((keyword) => lowerQuery.includes(keyword))) {
      return intent;
    }
  }

  return "general";
}

function shouldRecommendProducts(intent) {
  return intent !== "greeting" && intent !== "general" && intent !== "shopping";
}

/**
 * Search Pinecone for relevant context
 */
async function searchPinecone(query, topK = 10) {
  try {
    const index = await initializePinecone();

    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    // Search Pinecone
    const searchResults = await index.query({
      vector: queryEmbedding,
      topK: topK,
      includeMetadata: true,
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
    const query = userQuery.trim();
    console.log("💬 User Query:", query);

    const intent = extractIntent(query);
    console.log("🎯 Intent:", intent);

    if (intent === "greeting") {
      return {
        success: true,
        message:
          "नमस्ते! मैं STM Fruit Shop का AI Assistant हूं। मैं आपकी मदद के लिए यहां हूं। आप फल, ड्राई फ्रूट्स, ऑर्डर या हेल्थ संबंधी सवाल पूछ सकते हैं।",
        intent,
        recommendedProducts: [],
      };
    }

    if (intent === "general") {
      return {
        success: true,
        message:
          "मैं STM Fruit Shop का AI Assistant हूं। आप हमारी products, delivery, payment या health tips के बारे में पूछ सकते हैं। कैसे मदद कर सकता हूं?",
        intent,
        recommendedProducts: [],
      };
    }

    console.log("🔍 Searching Pinecone... (top 10)");
    const pineconeResults = await searchPinecone(query, 10);
    console.log(`📊 Found ${pineconeResults.length} relevant matches`);

    const context = pineconeResults
      .map((match, idx) => {
        const meta = match.metadata || {};
        return `${idx + 1}. ${meta.productName || "Unknown"} (${meta.category || "General"}):\n${meta.text || ""}`;
      })
      .join("\n\n");

    const productNames = [
      ...new Set(
        pineconeResults
          .map((match) => match.metadata?.productName)
          .filter(Boolean),
      ),
    ];
    let products = [];

    if (shouldRecommendProducts(intent) && productNames.length > 0) {
      products = await Product.find({
        productName: { $in: productNames.map((name) => new RegExp(name, "i")) },
      }).limit(6);
    }

    if (products.length === 0 && shouldRecommendProducts(intent)) {
      products = await Product.find({ category: { $exists: true } })
        .sort({ viewCount: -1 })
        .limit(4);
    }

    const productListText =
      products.length > 0
        ? products
            .map(
              (p, idx) => `${idx + 1}. ${p.productName} - ₹${p.sellingPrice}`,
            )
            .join("\n")
        : "No direct product matches found, but we can still give useful recommendations.";

    console.log("🤖 Generating AI response...");
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `You are a helpful AI assistant for STM Fruit Shop in Sitamarhi.

User Query: "${query}"
Detected Intent: ${intent}

Retrieved Product Context (top 10):
${context || "No strong product context found."}

Available Product List:
${productListText}

Instructions:
- Answer in a friendly and natural tone.
- If the user asks about products or health, recommend 2-3 relevant products.
- If the question is general, respond helpfully without unnecessary product suggestions.
- Prefer simple Hindi-English (Hinglish) if the query is in Hindi.
- Keep the answer concise and practical.
- Mention only products that fit the user's need.

Response:`;

    const result = await model.generateContent(prompt);
    const aiMessage = result.response.text();

    const productRecommendations = products.slice(0, 4).map((product) => ({
      _id: product._id,
      name: product.productName,
      price: product.sellingPrice,
      image:
        product.productImage && product.productImage[0]
          ? product.productImage[0]
          : "",
      category: product.category,
      reason: `Recommended for your ${intent.replace(/([A-Z])/g, " $1").toLowerCase()} needs.`,
    }));

    return {
      success: true,
      message: aiMessage,
      intent,
      recommendedProducts: shouldRecommendProducts(intent)
        ? productRecommendations
        : [],
      relevanceScores: pineconeResults.slice(0, 5).map((match) => ({
        product: match.metadata?.productName || "Unknown",
        score: match.score?.toFixed(3) || "0.000",
      })),
    };
  } catch (error) {
    console.error("❌ RAG Error:", error);
    return {
      success: false,
      message:
        "माफ कीजिए, अभी technology issue आ गया है। कृपया कुछ समय बाद फिर कोशिश करें।",
      intent: "general",
      recommendedProducts: [],
      error: error.message,
    };
  }
}

module.exports = {
  processKnowledgeBaseToPinecone,
  generateEnhancedRAGResponse,
  searchPinecone,
  initializePinecone,
};
