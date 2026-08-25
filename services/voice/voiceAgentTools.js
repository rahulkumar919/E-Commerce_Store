/**
 * Voice Agent Tools — Function Calling for STM Fruit Shop
 *
 * Each tool is a real backend API call. The AI decides which tool to use
 * based on the user's intent. Tools return structured JSON that the LLM
 * converts to natural language.
 */
const Product = require("../../models/productModel");
const Order = require("../../models/orderModel");
const VoiceSession = require("../../models/voiceSessionModel");

// ── Tool Definitions (schema for LLM function calling) ───────────────────────
const TOOL_DEFINITIONS = [
  {
    name: "search_products",
    description: "Search for available products by name, category, or health benefit",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search term (e.g. 'mango', 'dry fruits', 'immunity')" },
        category: { type: "string", description: "Category filter (Fruits, Dry Fruits, Fruit Juice, Cakes, Birthday)" },
      },
      required: ["query"],
    },
  },
  {
    name: "check_product_price",
    description: "Get the price and availability of a specific product",
    parameters: {
      type: "object",
      properties: {
        productName: { type: "string", description: "Exact or partial product name" },
      },
      required: ["productName"],
    },
  },
  {
    name: "check_inventory",
    description: "Check if a product is in stock",
    parameters: {
      type: "object",
      properties: {
        productName: { type: "string" },
      },
      required: ["productName"],
    },
  },
  {
    name: "get_offers",
    description: "Get current offers, discounts, and deals",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "book_callback",
    description: "Book a callback request for the customer to be contacted",
    parameters: {
      type: "object",
      properties: {
        customerName: { type: "string" },
        phone: { type: "string" },
        preferredTime: { type: "string" },
        reason: { type: "string" },
      },
      required: ["phone"],
    },
  },
  {
    name: "get_delivery_info",
    description: "Get delivery areas, timing, charges, and availability",
    parameters: { type: "object", properties: {} },
  },
  {
    name: "get_order_status",
    description: "Check the status of a customer's order",
    parameters: {
      type: "object",
      properties: {
        orderId: { type: "string" },
        phone: { type: "string" },
      },
    },
  },
  {
    name: "recommend_for_health",
    description: "Recommend products based on a health condition or goal",
    parameters: {
      type: "object",
      properties: {
        condition: {
          type: "string",
          description: "e.g. immunity, weight loss, energy, diabetes, digestion, heart health",
        },
      },
      required: ["condition"],
    },
  },
  {
    name: "escalate_to_human",
    description: "Escalate the conversation to a human agent when AI cannot help",
    parameters: {
      type: "object",
      properties: {
        reason: { type: "string" },
        sessionId: { type: "string" },
      },
    },
  },
];

// ── Tool Executors ────────────────────────────────────────────────────────────

async function search_products({ query, category }) {
  try {
    const filter = { isAvailable: { $ne: false } };
    if (category) filter.category = new RegExp(category, "i");

    const terms = query.split(/\s+/).filter((w) => w.length > 2);
    const regex = new RegExp(terms.join("|"), "i");

    const products = await Product.find({
      ...filter,
      $or: [
        { productName: regex },
        { category: regex },
        { description: regex },
        { subcategory: regex },
      ],
    })
      .select("productName category subcategory price selling stock isAvailable badge productImage")
      .sort({ isTrending: -1, viewCount: -1 })
      .limit(5)
      .lean();

    if (products.length === 0) {
      return {
        found: false,
        message: "No products found matching your search",
        products: [],
      };
    }

    return {
      found: true,
      count: products.length,
      products: products.map((p) => ({
        id: p._id,
        name: p.productName,
        category: p.category,
        price: p.price,
        sellingPrice: p.selling,
        discount:
          p.price > p.selling
            ? `${Math.round(((p.price - p.selling) / p.price) * 100)}% off`
            : null,
        inStock: (p.stock || 0) > 0,
        badge: p.badge || null,
        image: p.productImage?.[0] || null,
      })),
    };
  } catch (err) {
    return { found: false, error: err.message, products: [] };
  }
}

async function check_product_price({ productName }) {
  try {
    const product = await Product.findOne({
      productName: new RegExp(productName, "i"),
      isAvailable: { $ne: false },
    })
      .select("productName price selling stock badge")
      .lean();

    if (!product) {
      return { found: false, message: `"${productName}" is not available right now` };
    }

    return {
      found: true,
      name: product.productName,
      mrp: product.price,
      sellingPrice: product.selling,
      discount:
        product.price > product.selling
          ? `${Math.round(((product.price - product.selling) / product.price) * 100)}%`
          : "0%",
      inStock: (product.stock || 0) > 0,
      stockQty: product.stock || 0,
    };
  } catch (err) {
    return { found: false, error: err.message };
  }
}

async function check_inventory({ productName }) {
  try {
    const product = await Product.findOne({
      productName: new RegExp(productName, "i"),
    })
      .select("productName stock isAvailable category")
      .lean();

    if (!product)
      return { available: false, message: "Product not found in our catalog" };

    return {
      name: product.productName,
      available: product.isAvailable !== false && (product.stock || 0) > 0,
      stockQty: product.stock || 0,
      category: product.category,
    };
  } catch (err) {
    return { available: false, error: err.message };
  }
}

async function get_offers() {
  // Fetch products with discounts > 10%
  try {
    const products = await Product.aggregate([
      { $match: { isAvailable: { $ne: false }, price: { $gt: 0 }, selling: { $gt: 0 } } },
      {
        $addFields: {
          discountPct: {
            $multiply: [
              { $divide: [{ $subtract: ["$price", "$selling"] }, "$price"] },
              100,
            ],
          },
        },
      },
      { $match: { discountPct: { $gte: 10 } } },
      { $sort: { discountPct: -1 } },
      { $limit: 5 },
      { $project: { productName: 1, category: 1, price: 1, selling: 1, discountPct: 1, badge: 1 } },
    ]);

    return {
      offers: products.map((p) => ({
        name: p.productName,
        category: p.category,
        mrp: p.price,
        sellingPrice: p.selling,
        discount: `${Math.round(p.discountPct)}% off`,
        badge: p.badge || null,
      })),
      count: products.length,
      shopOffer: "Free delivery on orders above ₹500",
    };
  } catch (err) {
    return {
      offers: [],
      shopOffer: "Free delivery on orders above ₹500",
      error: err.message,
    };
  }
}

async function book_callback({ customerName, phone, preferredTime, reason }) {
  // Log to voice session / could also send WhatsApp notification
  const record = {
    customerName: customerName || "Customer",
    phone,
    preferredTime: preferredTime || "Any time",
    reason: reason || "General inquiry",
    bookedAt: new Date().toISOString(),
  };

  console.log("📞 Callback booked:", record);

  // TODO: send WhatsApp message via Twilio/WATI if configured
  return {
    success: true,
    message: "Callback booked successfully",
    details: record,
    confirmationMessage: `Your callback has been scheduled. We'll call ${phone} ${
      preferredTime ? `at ${preferredTime}` : "shortly"
    }.`,
  };
}

async function get_delivery_info() {
  return {
    areas: ["Sitamarhi city", "within 10km radius"],
    timing: "Same-day delivery in 2 hours",
    charges: {
      below500: "₹30 delivery charge",
      above500: "FREE delivery",
    },
    cutoffTime: "Order before 6 PM for same-day delivery",
    contact: "+91 9142517255",
    whatsapp: "https://wa.me/919142517255",
    methods: ["Website", "WhatsApp order", "Phone call"],
  };
}

async function get_order_status({ orderId, phone }) {
  try {
    if (!orderId && !phone) {
      return { found: false, message: "Please provide your order ID or registered phone number" };
    }

    let order = null;
    if (orderId) {
      order = await Order.findById(orderId).lean();
    }

    if (!order) {
      return {
        found: false,
        message: "Order not found. Please contact us on WhatsApp: +91 9142517255",
      };
    }

    return {
      found: true,
      orderId: order._id,
      status: order.status || "Processing",
      amount: order.totalAmount,
      items: order.cartItems?.length || 0,
      createdAt: order.createdAt,
    };
  } catch (err) {
    return { found: false, error: err.message };
  }
}

async function recommend_for_health({ condition }) {
  const healthMap = {
    immunity: ["amla", "kiwi", "orange", "guava", "vitamin c"],
    "weight loss": ["apple", "watermelon", "pear", "papaya"],
    energy: ["banana", "dates", "almond", "cashew", "walnut"],
    diabetes: ["guava", "jamun", "pear", "apple"],
    digestion: ["papaya", "kiwi", "pear", "fig"],
    "heart health": ["pomegranate", "walnut", "grapes", "blueberry"],
    anemia: ["pomegranate", "dates", "raisin", "fig"],
    brain: ["walnut", "almond", "blueberry"],
    skin: ["papaya", "orange", "kiwi"],
  };

  const key = Object.keys(healthMap).find((k) =>
    condition.toLowerCase().includes(k)
  );

  const keywords = key ? healthMap[key] : condition.split(/\s+/).filter((w) => w.length > 3);
  const regex = new RegExp(keywords.join("|"), "i");

  try {
    const products = await Product.find({
      $or: [{ productName: regex }, { category: regex }],
      isAvailable: { $ne: false },
    })
      .select("productName category price selling productImage badge")
      .limit(4)
      .lean();

    return {
      condition,
      recommendations: products.map((p) => ({
        id: p._id,
        name: p.productName,
        category: p.category,
        price: p.selling || p.price,
        image: p.productImage?.[0] || null,
        badge: p.badge || null,
      })),
    };
  } catch (err) {
    return { condition, recommendations: [], error: err.message };
  }
}

async function escalate_to_human({ reason, sessionId }) {
  if (sessionId) {
    await VoiceSession.findOneAndUpdate(
      { sessionId },
      { status: "escalated", escalationReason: reason || "User requested human agent" }
    ).catch(() => {});
  }
  return {
    escalated: true,
    message:
      "Transferring you to a human agent. Please hold for a moment, or contact us on WhatsApp: +91 9142517255",
    whatsapp: "https://wa.me/919142517255",
    phone: "+91 9142517255",
  };
}

// ── Tool Dispatcher ───────────────────────────────────────────────────────────
const TOOL_EXECUTORS = {
  search_products,
  check_product_price,
  check_inventory,
  get_offers,
  book_callback,
  get_delivery_info,
  get_order_status,
  recommend_for_health,
  escalate_to_human,
};

async function executeTool(toolName, params) {
  const fn = TOOL_EXECUTORS[toolName];
  if (!fn) return { error: `Unknown tool: ${toolName}` };

  try {
    console.log(`🔧 Tool: ${toolName}`, JSON.stringify(params).slice(0, 100));
    const result = await fn(params);
    console.log(`   ✅ Tool result:`, JSON.stringify(result).slice(0, 150));
    return result;
  } catch (err) {
    console.error(`   ❌ Tool error (${toolName}):`, err.message);
    return { error: err.message };
  }
}

module.exports = { TOOL_DEFINITIONS, executeTool };
