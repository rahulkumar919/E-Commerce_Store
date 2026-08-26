require("dotenv").config();
const path = require("path");
const {
  processKnowledgeBaseToPinecone,
} = require("../services/enhancedRAGService");

async function main() {
  const required = [
    "OLLAMA_BASE_URL",
    "OLLAMA_EMBEDDING_MODEL",
    "PINECONE_API_KEY",
    "PINECONE_INDEX_NAME",
  ];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length)
    throw new Error(`Missing environment variables: ${missing.join(", ")}`);

  const pdfPath = path.join(__dirname, "../data/stm_data.pdf");
  console.log(`Indexing ${pdfPath}`);
  const result = await processKnowledgeBaseToPinecone(pdfPath);
  console.log(`Indexed ${result.chunksProcessed} PDF chunks into Pinecone.`);
}

main().catch((error) => {
  console.error("PDF indexing failed:", error.message);
  process.exitCode = 1;
});
