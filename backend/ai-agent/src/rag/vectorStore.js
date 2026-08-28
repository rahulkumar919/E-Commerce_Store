const { Pinecone } = require("@pinecone-database/pinecone");
const { embedDocuments, embedQuery } = require("./embeddings");

let index;

function getIndex() {
  if (!index) {
    if (!process.env.PINECONE_API_KEY || !process.env.PINECONE_INDEX_NAME) {
      throw new Error("PINECONE_API_KEY and PINECONE_INDEX_NAME are required");
    }
    const client = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
    index = client.index(process.env.PINECONE_INDEX_NAME);
  }
  return index;
}

async function upsertDocuments(documents) {
  const batchSize = 32;
  let uploaded = 0;
  for (let start = 0; start < documents.length; start += batchSize) {
    const batch = documents.slice(start, start + batchSize);
    const vectors = await embedDocuments(
      batch.map((document) => document.text),
    );
    const records = batch.map((document, position) => ({
      id: document.id || `knowledge-${Date.now()}-${start + position}`,
      values: vectors[position],
      metadata: { text: document.text, ...(document.metadata || {}) },
    }));
    await getIndex().upsert({ records });
    uploaded += records.length;
  }
  return uploaded;
}

async function searchVectors(query, topK = 5) {
  const vector = await embedQuery(query);
  const result = await getIndex().query({
    vector,
    topK,
    includeMetadata: true,
  });
  return result.matches || [];
}

module.exports = { upsertDocuments, searchVectors };
