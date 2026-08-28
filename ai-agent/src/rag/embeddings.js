const { embed } = require("../llm/llama");

async function embedDocuments(texts) {
  if (!Array.isArray(texts) || texts.length === 0) return [];
  return embed(texts);
}

async function embedQuery(text) {
  const [vector] = await embed([text]);
  return vector;
}

module.exports = {
  embedDocuments,
  embedQuery,
  embeddingModel: () =>
    process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text",
};
