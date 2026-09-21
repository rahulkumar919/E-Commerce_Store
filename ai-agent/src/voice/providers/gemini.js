/**
 * gemini.js — Gemini multimodal STT provider
 * ──────────────────────────────────────────
 * Transcribes audio recordings directly using Gemini.
 * No OpenAI API key or external Whisper server required.
 */

"use strict";

const { GoogleGenerativeAI } = require("@google/generative-ai");
const aiLogger               = require("../../utils/aiLogger");

let genAIClient = null;

function getGenAI() {
  if (!genAIClient) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set. Required for Gemini STT.");
    }
    genAIClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAIClient;
}

/**
 * transcribeWithGemini — Convert audio buffer to text using Gemini
 *
 * @param {Buffer} audioBuffer
 * @param {string} mimeType
 * @returns {Promise<{ text: string }>}
 */
async function transcribeWithGemini(audioBuffer, mimeType = "audio/webm") {
  const genAI = getGenAI();
  // Strip codec specifier e.g. "audio/webm;codecs=opus" -> "audio/webm"
  const cleanMime = (mimeType || "audio/webm").split(";")[0].trim();

  const candidateModels = [
    process.env.GEMINI_MODEL || "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
    "gemini-flash-latest",
  ];
  const uniqueModels = [...new Set(candidateModels)];

  const prompt =
    "You are a speech-to-text transcriber for an e-commerce shopping assistant. " +
    "Transcribe the user's spoken audio accurately in the exact language spoken (English, Hindi, or Hinglish). " +
    "Output ONLY the transcribed words. Do NOT output notes, explanations, timestamps, quotes, or conversational replies.";

  let lastError = null;

  for (const modelName of uniqueModels) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent([
        {
          inlineData: {
            data: audioBuffer.toString("base64"),
            mimeType: cleanMime,
          },
        },
        { text: prompt },
      ]);

      const rawText = result.response.text().trim();
      const text = rawText.replace(/^["']|["']$/g, "").trim();

      if (text) {
        return { text };
      }
    } catch (err) {
      lastError = err;
      aiLogger.warn("stt.gemini_model_fallback", {
        failedModel: modelName,
        error: err.message,
      });
      // Try next candidate model
      continue;
    }
  }

  throw lastError || new Error("Could not transcribe any speech from the audio.");
}

module.exports = { transcribeWithGemini };
