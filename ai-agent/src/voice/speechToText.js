/**
 * speechToText.js — Provider-agnostic STT abstraction
 * ──────────────────────────────────────────────────────
 * The voice handler calls transcribe() — it never knows which provider ran.
 *
 * Current providers (STT_PROVIDER env var):
 *   whisper  — OpenAI Whisper API (requires OPENAI_API_KEY + openai package)
 *
 * Adding a new provider:
 *   1. Create  ai-agent/src/voice/providers/google-stt.js
 *   2. Add a case here
 *   3. Set STT_PROVIDER=google-stt in .env
 *   Zero changes to the controller or agent.
 *
 * VOICE ARCHITECTURE:
 *   POST /api/ai/voice
 *     → multer (file → buffer)
 *     → authToken (userId)
 *     → voiceHandler in ai.controller.js
 *       → transcribe(buffer, mimeType)  ← THIS FILE
 *         → Whisper API → text
 *       → runAgent(text, history, ctx)  ← EXACT same path as text chat
 */

"use strict";

const { transcribeWithWhisper } = require("./providers/whisper");
const { transcribeWithGemini }  = require("./providers/gemini");

/**
 * transcribe — Convert audio buffer to text.
 *
 * @param {Buffer}  audioBuffer  From multer memoryStorage (req.file.buffer)
 * @param {string}  mimeType     From multer (req.file.mimetype)
 * @returns {Promise<{ text: string }>}
 * @throws if transcription fails (caller handles the error)
 */
async function transcribe(audioBuffer, mimeType) {
  if (!audioBuffer || audioBuffer.length === 0) {
    throw new Error("Audio buffer is empty");
  }

  // Default to gemini if GEMINI_API_KEY is available and no whisper key
  let provider = (process.env.STT_PROVIDER || "").toLowerCase().trim();
  if (!provider) {
    provider = process.env.OPENAI_API_KEY ? "whisper" : "gemini";
  }

  switch (provider) {
    case "gemini":
      return transcribeWithGemini(audioBuffer, mimeType);

    case "whisper":
      return transcribeWithWhisper(audioBuffer, mimeType);

    default:
      // If unknown, fallback to gemini if key exists
      if (process.env.GEMINI_API_KEY) {
        return transcribeWithGemini(audioBuffer, mimeType);
      }
      throw new Error(
        `Unknown STT_PROVIDER: "${provider}". Supported values: gemini, whisper`
      );
  }
}

module.exports = { transcribe };
