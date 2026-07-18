/**
 * STM Fruit Shop — Intelligent AI Chat Service
 * 
 * Works WITHOUT Gemini API (uses smart keyword matching + real MongoDB data)
 * When Gemini key is valid, uses full AI responses
 * 
 * Pipeline:
 * 1. Detect intent from query keywords
 * 2. Fetch real products from MongoDB  
 * 3. Try Gemini AI for response (if key valid)
 * 4. Fall back to smart pre-built responses with real product data
 */

// ─── Gemini setup (lazy, won't crash if key is invalid) ──────────────────────
let _genAI = null;
let _geminiWorking = null; // null = untested, true/false = tested result

async function tryGemini(prompt) {
  if (_geminiWorking === false) return null; // known bad key

  const key = process.env.GEMINI_API_KEY;
  if (!key || !key.startsWith("AIzaSy")) {
    _geminiWorking = false;
    return null;
  }

  try {
    if (!_genAI) {
      const { GoogleGenerativeAI } = require("@google/generative-ai");
      _genAI = new GoogleGenerativeAI(key);
    }

    const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-2.0-flash-lite"];
    for (const modelName of models) {
      try {
        const model = _genAI.getGenerativeModel({
          model: modelName,
          generationConfig: { temperature: 0.7, topP: 0.9, maxOutputTokens: 400 },
        });
        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        _geminiWorking = true;
        console.log(`✅ Gemini [${modelName}] response OK`);
        return text;
      } catch (e) {
        if (e.message?.includes("403") || e.message?.includes("leaked") || e.message?.includes("PERMISSION_DENIED")) {
          _geminiWorking = false;
          console.warn("⚠️ Gemini key invalid/leaked — using smart fallback");
          return null;
        }
        if (e.message?.includes("429")) {
          console.warn(`⚠️ ${modelName} quota exceeded, trying next...`);
          continue;
        }
        console.warn(`⚠️ ${modelName} error:`, e.message?.substring(0, 80));
      }
    }
  } catch (e) {
    _geminiWorking = false;
    console.warn("⚠️ Gemini init failed:", e.message);
  }
  return null;
}

// ─── STM Shop static data ─────────────────────────────────────────────────────
const SHOP = {
  name: "STM Fruit Shop",
  location: "Sitamarhi, Bihar - 843301",
  phone: "+91 9142517255",
  whatsapp: "https://wa.me/919142517255",
  hours: "8:00 AM - 9:00 PM (Daily)",
  delivery: "Same-day delivery in 2 hours (Sitamarhi city)",
  freeDelivery: "Free delivery above ₹500",
};

// ─── Intent detection ─────────────────────────────────────────────────────────
function detectIntent(query) {
  const q = query.toLowerCase().trim();

  // Pure greeting (short message with only greeting words)
  if (/^(hi|hello|hey|namaste|नमस्ते|हेलो|हाय|good morning|good evening|good afternoon|salam|hlo|hii|yo|sup)[\s!.?]*$/.test(q)) return "greeting";

  // Identity
  if (/(who are you|your name|tum kaun|तुम कौन|about you|aap kaun|assistant kya|क्या हो तुम|bot hai|ai hai)/.test(q)) return "identity";

  // Shop location
  if (/(location|address|kahan hai|कहाँ है|कहां है|shop kahan|dukan kahan|maps|google map|where is|kahan se|kaha par)/.test(q)) return "shopLocation";

  // Shop timing
  if (/(timing|time|kab khulta|kab band|opening|closing|hours|समय|कब खुलता|कब बंद|open hota|schedule)/.test(q)) return "shopTiming";

  // Delivery
  if (/(delivery|deliver|डिलीवरी|free delivery|delivery charge|delivery time|kitne time|delivery area|kahan delivery)/.test(q)) return "deliveryInfo";

  // Contact
  if (/(phone|number|contact|whatsapp|call|mobile|नंबर|संपर्क|फोन|helpline)/.test(q)) return "contact";

  // Payment
  if (/(payment|pay|upi|card|cod|cash|online pay|bhugtan|भुगतान|razorpay|paytm|gpay)/.test(q)) return "payment";

  // Order
  if (/(order karna|how to order|order kaise|order karein|buy karna|purchase|kharidna|khareedna|cart me|cart mein)/.test(q)) return "howToOrder";

  // About shop (what does it sell)
  if (/(stm ke bare|stm fruit shop|shop ke bare|hamare shop|what do you sell|kya milta|kya bechte|about shop|shop info|apni shop|shop me kya)/.test(q)) return "aboutShop";

  // Services list
  if (/(services|kya milta hai|kya available|what available|sab kya|products available|fruits available|cakes available)/.test(q)) return "services";

  // Health & product queries (ALL go to productSearch)
  return "productSearch";
}

// ─── Static responses for non-product intents ─────────────────────────────────
function getStaticResponse(intent) {
  const r = {
    greeting: `नमस्ते! 🙏 STM Fruit Shop में आपका स्वागत है! मैं आपकी मदद के लिए यहां हूं।\n\nआप पूछ सकते हैं:\n• 🍎 Immunity, energy, weight loss ke liye products\n• 🎂 Birthday cakes & decorations\n• 🚚 Delivery & order info\n• 📍 Shop location & timing\n\nआज क्या चाहिए? 😊`,

    identity: `मैं STM Fruit Shop का AI Assistant हूं! 🤖\n\nमुझे Gemini AI + Product Database से power किया गया है। मैं आपको:\n• 🍎 Fruit & dry fruit recommendations\n• 💪 Health tips with product suggestions\n• 🎂 Birthday & party planning help\n• 🚚 Order & delivery assistance\n\nदे सकता हूं। कैसे मदद करूं? 😊`,

    shopLocation: `📍 **STM Fruit Shop Location:**\n\n🏠 Sitamarhi, Bihar - 843301\n🗺️ Google Maps: https://maps.google.com/?q=STM+Fruit+Shop+Sitamarhi+Bihar\n\n📦 Sitamarhi city में 2 घंटे में delivery!\n📞 WhatsApp: ${SHOP.phone}`,

    shopTiming: `🕐 **STM Fruit Shop Timings:**\n\n⏰ Open: 8:00 AM - 9:00 PM\n📅 Days: Daily (रोज, No weekly off! 🎉)\n\nकिसी भी time WhatsApp करें — हम available हैं!\n📱 ${SHOP.phone}`,

    deliveryInfo: `🚚 **Delivery Information:**\n\n📍 Area: Sitamarhi city (10km radius)\n⚡ Time: Same-day (2 घंटे में!)\n💰 Free: ₹500 से ऊपर FREE delivery\n📦 Methods: WhatsApp, Website, Phone call\n\nOrder करें: ${SHOP.phone} 📱`,

    contact: `📞 **Contact STM Fruit Shop:**\n\n📱 Phone: ${SHOP.phone}\n💬 WhatsApp: ${SHOP.whatsapp}\n\n8 AM to 9 PM available हैं। WhatsApp message करें — 5 minutes में reply! ✅`,

    payment: `💳 **Payment Options:**\n\n✅ Cash on Delivery (COD)\n✅ UPI (PhonePe, GPay, Paytm)\n✅ Debit/Credit Card\n✅ Net Banking\n\nSab methods accept karte hain! 💰\nOrder: ${SHOP.phone} 📱`,

    howToOrder: `📦 **Order karne ke 2 easy ways:**\n\n**1️⃣ Website (Recommended):**\n→ Product choose करें\n→ Cart में add करें\n→ Checkout → Address → Payment\n\n**2️⃣ WhatsApp (Fast):**\n→ Message: ${SHOP.phone}\n→ Product बताएं\n→ Address share करें\n→ 2 hours में delivery! 🚚`,

    aboutShop: `🏪 **STM Fruit Shop के बारे में:**\n\n📍 Location: Sitamarhi, Bihar\n⏰ Timing: 8 AM - 9 PM (Daily)\n🚚 Same-day delivery in 2 hours\n💰 Free delivery above ₹500\n\n**हम बेचते हैं:**\n🍎 Fresh Fruits | 🥜 Dry Fruits | 🥤 Fresh Juices\n🎂 Birthday Cakes | 🎈 Party Decorations | 🎁 Gift Hampers\n\n📞 ${SHOP.phone}`,

    services: `🛒 **STM Fruit Shop में available:**\n\n🍎 Fresh Fruits (seasonal & imported)\n🥜 Dry Fruits & Nuts (badam, kaju, akhrot, kishmish)\n🥤 Fresh Juices (on order)\n🎂 Birthday Cakes (advance booking required)\n🎈 Party Decorations (balloons, banners)\n🎁 Gift Hampers (customizable)\n🚚 Home Delivery (free above ₹500)\n\nKuch specific chahiye? बताइए! 😊\n📱 ${SHOP.phone}`,
  };
  return r[intent] || null;
}

// ─── Smart keyword-to-product mapping ────────────────────────────────────────
function getProductSearchTerms(query) {
  const q = query.toLowerCase();
  
  const keywordMap = [
    { terms: ["immunity", "immune", "vitamin c", "cold", "flu", "बीमार", "सर्दी", "रोग प्रतिरोधक", "khansi"], category: "immunity", dbKeywords: ["amla", "citrus", "orange", "kiwi", "lemon", "guava", "vitamin"] },
    { terms: ["weight loss", "वजन कम", "motapa", "मोटापा", "fat", "slim", "diet", "पतला", "वजन घटाना"], category: "weightLoss", dbKeywords: ["apple", "cucumber", "watermelon", "papaya", "pear"] },
    { terms: ["energy", "stamina", "ताकत", "थकान", "fatigue", "workout", "gym", "ऊर्जा", "tired", "thaka"], category: "energy", dbKeywords: ["banana", "dates", "dry fruits", "almond", "badam", "cashew", "kaju"] },
    { terms: ["digestion", "पाचन", "constipation", "कब्ज", "stomach", "पेट", "acidity", "gas", "bloating"], category: "digestion", dbKeywords: ["papaya", "kiwi", "pear", "prune", "plum", "fig"] },
    { terms: ["heart", "दिल", "cholesterol", "blood pressure", "bp", "हृदय", "cardiac"], category: "heartHealth", dbKeywords: ["pomegranate", "berry", "walnut", "akhrot", "almond", "grape"] },
    { terms: ["brain", "memory", "याददाश्त", "concentration", "focus", "दिमाग", "study", "पढ़ाई"], category: "brainHealth", dbKeywords: ["walnut", "almond", "blueberry", "dark grape", "brahmi"] },
    { terms: ["skin", "त्वचा", "glow", "चमक", "beauty", "सुंदरता", "face", "fairness", "acne"], category: "skinCare", dbKeywords: ["avocado", "papaya", "orange", "vitamin e", "aloe"] },
    { terms: ["anemia", "खून", "hemoglobin", "iron", "एनीमिया", "रक्त", "हीमोग्लोबिन", "khoon"], category: "anemia", dbKeywords: ["pomegranate", "dates", "raisin", "spinach", "beet"] },
    { terms: ["diabetes", "sugar", "मधुमेह", "blood sugar", "शुगर", "डायबिटीज"], category: "diabetes", dbKeywords: ["bitter gourd", "jamun", "guava", "apple", "pear"] },
    { terms: ["birthday", "जन्मदिन", "bday", "celebration", "party", "cake", "केक", "happy birthday"], category: "birthday", dbKeywords: ["cake", "birthday", "decoration", "fruit basket"] },
    { terms: ["dry fruit", "ड्राई फ्रूट", "nuts", "badam", "kaju", "cashew", "almond", "walnut", "akhrot", "raisin", "kishmish", "pista"], category: "dryFruits", dbKeywords: ["almond", "cashew", "walnut", "raisin", "pista", "dates", "fig"] },
    { terms: ["fruit", "फल", "fresh fruit", "ताजे फल", "mango", "आम", "apple", "सेब", "banana", "केला", "grapes", "अंगूर", "orange", "संतरा"], category: "fruits", dbKeywords: [] },
    { terms: ["juice", "जूस", "drink", "fresh juice", "smoothie"], category: "juice", dbKeywords: ["juice", "drink"] },
    { terms: ["gift", "hamper", "gifting", "present", "gift basket"], category: "gift", dbKeywords: ["gift", "hamper", "basket"] },
  ];

  for (const mapping of keywordMap) {
    if (mapping.terms.some(t => q.includes(t))) {
      return { category: mapping.category, dbKeywords: mapping.dbKeywords, terms: mapping.terms };
    }
  }
  
  // Extract any meaningful word for generic search
  const words = q.split(/\s+/).filter(w => w.length > 3 && !["what", "which", "how", "best", "tell", "give", "want", "need", "karo", "kare", "liye", "mujhe", "mere", "mera", "chahiye", "dekhna"].includes(w));
  return { category: "general", dbKeywords: words.slice(0, 3), terms: [] };
}

// ─── Smart response builder (no Gemini needed) ───────────────────────────────
function buildSmartResponse(query, intent, products, searchInfo) {
  const q = query.toLowerCase();
  const productList = products.slice(0, 4).map(p => `🌟 **${p.productName}** — ₹${p.selling || p.price}/kg`).join("\n");
  const hasProducts = products.length > 0;

  // Health-specific responses
  const healthResponses = {
    immunity: `💪 **Immunity Boost ke liye:**\n\n${hasProducts ? productList : "🍋 Amla, Kiwi, Orange, Guava available hain"}\n\nये fruits Vitamin C se भरपूर हैं जो immunity strong करते हैं! रोज खाएं और healthy रहें। 🌟\n\n📱 Order: ${SHOP.phone}`,
    
    weightLoss: `⚖️ **Weight Loss ke liye:**\n\n${hasProducts ? productList : "🍎 Apple, Watermelon, Papaya available hain"}\n\nये low-calorie, high-fiber fruits हैं जो weight manage करने में help करते हैं! 💚\n\n📱 Order: ${SHOP.phone}`,
    
    energy: `⚡ **Energy & Stamina ke liye:**\n\n${hasProducts ? productList : "🍌 Banana, Dates, Dry Fruits available hain"}\n\nये natural energy boosters हैं! Gym से पहले banana और workout के बाद dry fruits लें। 💪\n\n📱 Order: ${SHOP.phone}`,
    
    digestion: `🌿 **Digestion ke liye:**\n\n${hasProducts ? productList : "🍈 Papaya, Kiwi, Pear available hain"}\n\nये fruits digestive enzymes से भरपूर हैं। रोज सुबह खाली पेट खाएं! 🌟\n\n📱 Order: ${SHOP.phone}`,
    
    heartHealth: `❤️ **Heart Health ke liye:**\n\n${hasProducts ? productList : "🫐 Pomegranate, Grapes, Walnut available hain"}\n\nये antioxidant-rich fruits cholesterol control करते हैं। Heart को healthy रखें! 💚\n\n📱 Order: ${SHOP.phone}`,
    
    brainHealth: `🧠 **Brain & Memory ke liye:**\n\n${hasProducts ? productList : "🥜 Walnut, Almond, Dark Grapes available hain"}\n\nWalnut shape में brain jaisa दिखता है और brain को boost करता है! Omega-3 से भरपूर। 🌟\n\n📱 Order: ${SHOP.phone}`,
    
    skinCare: `✨ **Glowing Skin ke liye:**\n\n${hasProducts ? productList : "🍑 Papaya, Orange, Avocado available hain"}\n\nVitamin C और antioxidants skin को glow करते हैं! Regularly खाएं। 💫\n\n📱 Order: ${SHOP.phone}`,
    
    anemia: `🩸 **Anemia/Khoon ke liye:**\n\n${hasProducts ? productList : "🌰 Pomegranate, Dates, Raisins available hain"}\n\nये iron-rich fruits hemoglobin बढ़ाते हैं। Pomegranate juice रोज पिएं! ❤️\n\n📱 Order: ${SHOP.phone}`,
    
    diabetes: `🩺 **Diabetes/Sugar Control ke liye:**\n\n${hasProducts ? productList : "🍐 Guava, Apple, Pear available hain"}\n\nLow GI fruits जो blood sugar control करते हैं। Doctor से consult भी करें। 💚\n\n📱 Order: ${SHOP.phone}`,
    
    birthday: `🎂 **Birthday Celebration ke liye:**\n\n${hasProducts ? productList : "🎂 Birthday Cakes, 🎈 Decorations, 🎁 Gift Hampers available hain"}\n\nSTM Fruit Shop में custom birthday cakes और party decorations available हैं!\n\n⚡ Advance booking करें:\n📱 WhatsApp: ${SHOP.phone}`,
    
    dryFruits: `🥜 **Premium Dry Fruits:**\n\n${hasProducts ? productList : "🌰 Badam, Kaju, Akhrot, Kishmish, Pista, Dates available hain"}\n\nFresh और premium quality dry fruits! Health के लिए best gift भी हैं। 🌟\n\n📱 Order: ${SHOP.phone}`,
    
    fruits: `🍎 **Fresh Fruits Collection:**\n\n${hasProducts ? productList : "🍎 Apples, Mangoes, Bananas, Oranges, Grapes available hain"}\n\nDaily fresh fruits आते हैं — seasonal और imported दोनों! 🌿\n\nSame-day delivery in 2 hours!\n📱 ${SHOP.phone}`,
    
    juice: `🥤 **Fresh Juices:**\n\n${hasProducts ? productList : "🥤 Fresh fruit juices on order available हैं"}\n\nFresh pressed juices — no preservatives, pure natural! 🌿\n\n📱 Order करें: ${SHOP.phone}`,
    
    gift: `🎁 **Gift Hampers:**\n\n${hasProducts ? productList : "🎁 Customizable fruit baskets & dry fruit gift hampers available हैं"}\n\nBirthday, Anniversary, Festival — हर occasion के लिए perfect gift!\n\n📱 WhatsApp करें: ${SHOP.phone}`,
  };

  if (healthResponses[searchInfo?.category]) {
    return healthResponses[searchInfo.category];
  }

  // Generic product response
  if (hasProducts) {
    return `आपके सवाल "${query}" के लिए ये products recommend करता हूं:\n\n${productList}\n\nSame-day delivery available है! 🚚\n📱 Order: ${SHOP.phone}`;
  }

  // No products found - general helpful response  
  return `नमस्ते! 🙏 "${query}" के बारे में बताता हूं:\n\nSTM Fruit Shop में fresh fruits, dry fruits, juices, cakes और decorations available हैं।\n\n🌟 **Popular Items:**\n• 🍎 Fresh Fruits (₹40-₹300/kg)\n• 🥜 Dry Fruits (₹200-₹1200/kg)\n• 🎂 Birthday Cakes (advance order)\n• 🎈 Party Decorations\n\n📱 WhatsApp: ${SHOP.phone}\n⚡ Same-day delivery!`;
}

// ─── Main function ─────────────────────────────────────────────────────────
async function generateEnhancedRAGResponse(userQuery, Product) {
  const query = userQuery?.trim();
  if (!query) throw new Error("Empty query");

  console.log(`\n💬 Query: "${query}"`);

  const intent = detectIntent(query);
  console.log(`🎯 Intent: ${intent}`);

  // Static intent → instant response
  const staticReply = getStaticResponse(intent);
  if (staticReply) {
    return { success: true, message: staticReply, intent, recommendedProducts: [] };
  }

  // Product search intent → fetch real products
  const searchInfo = getProductSearchTerms(query);
  console.log(`🔍 Search category: ${searchInfo.category}, keywords: ${searchInfo.dbKeywords.slice(0,3).join(", ")}`);

  let products = [];
  try {
    // Build search query using extracted keywords
    const allKeywords = [...searchInfo.dbKeywords, ...query.split(/\s+/).filter(w => w.length > 3)];
    const searchRegex = new RegExp(allKeywords.filter(Boolean).join("|"), "i");

    products = await Product.find({
      $or: [
        { productName: searchRegex },
        { category: searchRegex },
        { description: searchRegex },
      ],
      isAvailable: { $ne: false },
    })
      .select("productName brandName category productImage price selling")
      .sort({ isTrending: -1, viewCount: -1 })
      .limit(6)
      .lean();

    // Fallback: trending products
    if (products.length === 0) {
      products = await Product.find({ isAvailable: { $ne: false } })
        .select("productName brandName category productImage price selling")
        .sort({ isTrending: -1, viewCount: -1 })
        .limit(4)
        .lean();
    }

    console.log(`🛒 Products: ${products.length}`);
  } catch (dbErr) {
    console.warn("⚠️ DB error:", dbErr.message);
  }

  // Try Gemini for richer AI response
  let aiMessage = null;
  if (process.env.GEMINI_API_KEY?.startsWith("AIzaSy")) {
    const productContext = products.length > 0
      ? products.map((p, i) => `${i + 1}. ${p.productName} (${p.category}) — ₹${p.selling || p.price}/kg`).join("\n")
      : "STM Fruit Shop has fresh fruits, dry fruits, juices, cakes, and decorations.";

    const prompt = `You are a friendly AI assistant for STM Fruit Shop in Sitamarhi, Bihar, India.

Shop: ${SHOP.name} | Phone: ${SHOP.phone} | Hours: ${SHOP.hours} | Delivery: ${SHOP.delivery}

User Query: "${query}"

Available Products in Store:
${productContext}

Instructions:
1. Answer DIRECTLY about the user's specific question — not generic
2. Recommend 2-3 specific products from the list if relevant to health/products
3. Reply in Hinglish (Hindi-English mix) — warm and friendly
4. Keep it concise (3-4 sentences)
5. End with order encouragement
6. Use relevant emojis

Response:`;

    aiMessage = await tryGemini(prompt);
  }

  // Use Gemini response or smart fallback
  const finalMessage = aiMessage || buildSmartResponse(query, intent, products, searchInfo);

  const recommendedProducts = products.slice(0, 4).map(p => ({
    _id: p._id,
    name: p.productName,
    price: p.selling || p.price,
    image: p.productImage?.[0] || "",
    category: p.category,
  }));

  return {
    success: true,
    message: finalMessage,
    intent,
    recommendedProducts,
    aiPowered: !!aiMessage,
  };
}

module.exports = { generateEnhancedRAGResponse };
