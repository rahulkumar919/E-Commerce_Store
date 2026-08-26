require("dotenv").config();
const path = require("path");
const {
  processKnowledgeBaseToPinecone,
} = require("../services/enhancedRAGService");

async function main() {
  const pdfPath = path.join(__dirname, "../data/stm_data.pdf");
  const result = await processKnowledgeBaseToPinecone(pdfPath);
  console.log(`Indexed ${result.chunksProcessed} PDF chunks into Pinecone.`);
}

main().catch((error) => {
  console.error("PDF indexing failed:", error.message);
  process.exitCode = 1;
});
