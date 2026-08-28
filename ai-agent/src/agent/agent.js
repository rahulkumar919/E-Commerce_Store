const { chat } = require("../llm/llama");
const { SYSTEM_PROMPT } = require("./systemPrompt");
const { searchProducts } = require("../tools/searchProducts");
const { searchKnowledge } = require("../tools/searchKnowledge");
const { getProduct } = require("../tools/getProduct");
const { getCart } = require("../tools/getCart");
const { addToCart } = require("../tools/addToCart");
const { removeFromCart } = require("../tools/removeFromCart");

const toolDefinitions = [
  {
    type: "function",
    function: {
      name: "searchProducts",
      description: "Find available shop products relevant to a request.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "searchKnowledge",
      description:
        "Search the STM shop PDF knowledge base and return the 10 most relevant factual passages.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getProduct",
      description: "Get details for one product by id.",
      parameters: {
        type: "object",
        properties: { productId: { type: "string" } },
        required: ["productId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getCart",
      description: "View the signed-in user's cart.",
      parameters: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "addToCart",
      description: "Add one product to the signed-in user's cart.",
      parameters: {
        type: "object",
        properties: { productId: { type: "string" } },
        required: ["productId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "removeFromCart",
      description:
        "Immediately remove the named product from the signed-in user's cart when the user explicitly says remove or delete it. Do not ask for confirmation or call getCart first.",
      parameters: {
        type: "object",
        properties: {
          productId: {
            type: "string",
            description: "MongoDB product ID when known",
          },
          productName: {
            type: "string",
            description: "Product name such as Khajoor or Dates",
          },
          query: {
            type: "string",
            description: "Product search text when the exact name is unknown",
          },
        },
        anyOf: [
          { required: ["productId"] },
          { required: ["productName"] },
          { required: ["query"] },
        ],
      },
    },
  },
];

const handlers = {
  searchProducts,
  searchKnowledge,
  getProduct,
  getCart,
  addToCart,
  removeFromCart,
};

function requestedCartRemoval(query) {
  const match = query.match(
    /(?:remove|delete|take out|hatao|nikal)\s+(.+?)\s+(?:from|in)\s+(?:my\s+)?(?:cart|basket)/i,
  );
  if (!match) return null;
  return match[1].replace(/[?.!,]+$/, "").trim();
}

async function runAgent({
  query,
  sessionId = "default",
  userId,
  ProductModel,
  CartModel,
}) {
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: query },
  ];
  const products = [];
  const maxToolRounds = 3;
  const removalRequest = requestedCartRemoval(query);
  let removalHandled = false;
  let removalResult = null;

  try {
    for (let round = 0; round <= maxToolRounds; round += 1) {
      let assistant;
      try {
        assistant = await chat(messages, { tools: toolDefinitions });
      } catch (err) {
        console.warn("LLM chat error (falling back to direct store logic):", err.message);
        break;
      }
      messages.push(assistant);
      const calls = assistant?.tool_calls || [];

      const hasRemovalCall = calls.some(
        (call) => call.function?.name === "removeFromCart",
      );
      if (removalRequest && !removalHandled && !hasRemovalCall) {
        removalHandled = true;
        messages[messages.length - 1] = { role: "assistant", content: "" };
        removalResult = await removeFromCart({
          productName: removalRequest,
          userId,
          CartModel,
        });
        messages.push({
          role: "tool",
          tool_name: "removeFromCart",
          content: JSON.stringify(removalResult),
        });
        continue;
      }

      if (!calls.length) {
        const text = assistant?.content?.trim();
        if (text) {
          return {
            message: text,
            products,
            sessionId,
          };
        }
        break;
      }

      for (const call of calls) {
        const name = call.function?.name;
        const rawArgs = call.function?.arguments || {};
        const args = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs;
        const handler = handlers[name];
        let result;
        try {
          result =
            name === "removeFromCart" && removalResult
              ? removalResult
              : handler
                ? await handler({ ...args, userId, ProductModel, CartModel })
                : { error: `Unknown tool: ${name}` };
        } catch (error) {
          result = { error: error.message };
        }
        if (name === "removeFromCart" && !removalResult) {
          removalResult = result;
        }
        if (result && result.products) products.push(...result.products);
        messages.push({
          role: "tool",
          tool_name: name,
          content: JSON.stringify(result),
        });
      }
    }
  } catch (error) {
    console.warn("runAgent error:", error.message);
  }

  // Graceful fallback when LLM is unavailable in production or does not return text
  if (removalRequest && !removalHandled) {
    const res = await removeFromCart({
      productName: removalRequest,
      userId,
      CartModel,
    });
    return {
      message: res.message || res.error || "Cart updated successfully.",
      products: [],
      sessionId,
    };
  }

  if (products.length === 0 && ProductModel) {
    try {
      const searchRes = await searchProducts({ query, ProductModel });
      if (searchRes?.products?.length) {
        products.push(...searchRes.products);
      }
    } catch (e) {
      console.warn("searchProducts fallback error:", e.message);
    }
  }

  const isGreeting = /^(hi|hello|hey|namaste|pranam|good\s+(morning|evening|afternoon)|hola)/i.test(
    (query || "").trim(),
  );

  let fallbackMessage = "";
  if (isGreeting) {
    fallbackMessage =
      "नमस्ते! 🙏 STM Fruit Shop में आपका स्वागत है। मैं ताजे फल, ड्राई फ्रूट्स, जूस, केक और डेकोरेशन से जुड़े सवालों में आपकी मदद कर सकता हूं। आप क्या देखना चाहते हैं?";
  } else if (products.length > 0) {
    fallbackMessage = `यहाँ STM Fruit Shop से आपके लिए कुछ बेहतरीन विकल्प हैं: ${products
      .slice(0, 3)
      .map((p) => p.name)
      .join(", ")}। आप इनमें से किसी पर भी क्लिक करके देख सकते हैं या कार्ट में जोड़ सकते हैं! 🍎`;
  } else {
    fallbackMessage =
      "STM Fruit Shop में आपका स्वागत है! ताजे फल, ड्राई फ्रूट्स, जूस और बर्थडे केक के लिए आप हमसे WhatsApp (+91 9142517255) पर भी संपर्क कर सकते हैं। 🍎";
  }

  return {
    message: fallbackMessage,
    products,
    sessionId,
  };
}

module.exports = { runAgent, toolDefinitions };
