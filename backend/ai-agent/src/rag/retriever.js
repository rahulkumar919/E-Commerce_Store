const { searchVectors } = require("./vectorStore");

async function retrieveKnowledge(query, topK = 10) {
  const matches = await searchVectors(query, topK);
  return {
    matches,
    context: matches
      .filter((match) => match.metadata?.text)
      .map((match) => match.metadata.text)
      .join("\n\n---\n\n"),
  };
}

module.exports = { retrieveKnowledge };
