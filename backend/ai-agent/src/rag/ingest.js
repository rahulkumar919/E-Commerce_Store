const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const { upsertDocuments } = require("./vectorStore");

function chunkText(text, chunkSize = 1200, overlap = 200) {
  const normalized = text.replace(/\s+/g, " ").trim();
  const chunks = [];
  for (let start = 0; start < normalized.length; start += chunkSize - overlap) {
    const chunk = normalized.slice(start, start + chunkSize).trim();
    if (chunk) chunks.push(chunk);
  }
  return chunks;
}

async function ingestFile(filePath) {
  const isPdf = path.extname(filePath).toLowerCase() === ".pdf";
  const text = isPdf
    ? (await pdfParse(fs.readFileSync(filePath))).text
    : fs.readFileSync(filePath, "utf8");
  if (!text.trim())
    throw new Error(`No text could be extracted from ${filePath}`);
  const chunks = chunkText(text);
  return upsertDocuments(
    chunks.map((chunk, index) => ({
      id: `knowledge-${path.basename(filePath)}-${index}`,
      text: chunk,
      metadata: { source: path.basename(filePath), chunkIndex: index },
    })),
  );
}

module.exports = { chunkText, ingestFile };
