const { runAgent } = require("../ai-agent/src/agent/agent");
const { ingestFile } = require("../ai-agent/src/rag/ingest");
const path = require("path");
const {
  createStructuredAssistantOutput,
  selectRecommendedProducts,
} = require("./structuredAssistantOutput");

async function generateEnhancedRAGResponse(
  userQuery,
  ProductModel,
  options = {},
) {
  const result = await runAgent({
    query: userQuery,
    sessionId: options.sessionId || "default",
    userId: options.userId,
    ProductModel,
    CartModel: options.CartModel,
  });
  const products = Array.isArray(result.products) ? result.products : [];
  const structuredOutput = await createStructuredAssistantOutput({
    query: userQuery,
    draftAnswer: result.message,
    products,
  });
  const recommendedProducts = selectRecommendedProducts(
    products,
    structuredOutput.recommendedProductIds,
  );

  return {
    success: true,
    // Kept for existing clients; use structuredOutput for the typed contract.
    message: structuredOutput.answer,
    intent: structuredOutput.intent,
    recommendedProducts,
    structuredOutput,
    aiPowered: true,
    sessionId: result.sessionId,
  };
}

async function processKnowledgeBaseToPinecone(filePath) {
  const knowledgePath =
    filePath || path.join(__dirname, "../data/stm_data.pdf");
  const chunksProcessed = await ingestFile(knowledgePath);
  return { success: true, chunksProcessed };
}

module.exports = {
  generateEnhancedRAGResponse,
  processKnowledgeBaseToPinecone,
};
