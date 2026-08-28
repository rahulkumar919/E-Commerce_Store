const { retrieveKnowledge } = require("../rag/retriever");

async function searchKnowledge({ query }) {
  if (!query?.trim()) return { context: "", matches: [] };
  return retrieveKnowledge(query, 10);
}

module.exports = { searchKnowledge };
