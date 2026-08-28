/**
 * PDF Processing Controller
 * Processes PDF and stores in Pinecone vector database
 */

const { processPDFToPinecone } = require("../../services/professionalRAGService");
const path = require("path");

async function processPDF(req, res) {
    try {
        console.log("\n" + "=".repeat(60));
        console.log("📄 PDF PROCESSING REQUEST");
        console.log("=".repeat(60));

        // Path to the PDF file
        const pdfPath = path.join(__dirname, "../../data/ragdata.pdf");
        
        console.log("📁 PDF Path:", pdfPath);
        console.log("⏰ Started at:", new Date().toLocaleString());
        console.log("=".repeat(60) + "\n");

        // Process PDF and store in Pinecone
        const result = await processPDFToPinecone(pdfPath);

        console.log("\n" + "=".repeat(60));
        console.log("✅ PDF PROCESSING COMPLETE");
        console.log("=".repeat(60));
        console.log("📊 Result:", JSON.stringify(result, null, 2));
        console.log("⏰ Completed at:", new Date().toLocaleString());
        console.log("=".repeat(60) + "\n");

        res.json(result);

    } catch (error) {
        console.error("\n❌ PDF Processing Error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to process PDF",
            error: error.message
        });
    }
}

module.exports = processPDF;
