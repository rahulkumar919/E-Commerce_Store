const path = require("path");
const { runAgent } = require("../ai-agent/src/agent/agent");
const { ingestFile } = require("../ai-agent/src/rag/ingest");

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

  return {
    success: true,
    message: result.message,
    intent: "agent",
    recommendedProducts: result.products.slice(0, 6),
    aiPowered: true,
    sessionId: result.sessionId,
  };
}

async function processKnowledgeBaseToPinecone(filePath) {
  const knowledgePath =
    filePath || path.join(__dirname, "../data/knowledge-base.md");
  const chunksProcessed = await ingestFile(knowledgePath);
  return { success: true, chunksProcessed };
}

module.exports = {
  generateEnhancedRAGResponse,
  processKnowledgeBaseToPinecone,
};
