/**
 * whisper.js — Whisper-compatible STT provider
 * ──────────────────────────────────────────────
 * WHY A PROVIDER FILE:
 * speechToText.js never hardcodes a provider. It reads STT_PROVIDER env var
 * and delegates here. To switch to Google STT or Azure, add a new provider
 * file — speechToText.js stays unchanged.
 *
 * CURRENT IMPLEMENTATION:
 * Uses OpenAI's Whisper API (openai package, already widely available).
 * The same endpoint is also compatible with local Whisper servers.
 *
 * If OPENAI_API_KEY is not set, falls back to a stub that returns the raw
 * audio buffer as-is (useful for development when you want to type-test
 * the agent without real STT).
 */

"use strict";

/**
 * transcribeWithWhisper
 *
 * @param {Buffer}  audioBuffer  Raw audio bytes from multer memoryStorage
 * @param {string}  mimeType     e.g. "audio/webm" — used to name the file sent to Whisper
 * @returns {Promise<{ text: string }>}
 */
async function transcribeWithWhisper(audioBuffer, mimeType = "audio/webm") {
  // Optional dependency — only required when STT_PROVIDER=whisper
  let OpenAI;
  try {
    ({ default: OpenAI } = await import("openai"));
  } catch {
    throw new Error(
      "whisper provider requires the 'openai' package.\n" +
      "Run: npm install openai"
    );
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set. Required for Whisper STT.");
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Map MIME type to a file extension Whisper accepts
  const extMap = {
    "audio/webm":   "webm",
    "audio/ogg":    "ogg",
    "audio/mp4":    "mp4",
    "audio/mpeg":   "mp3",
    "audio/wav":    "wav",
    "audio/x-wav":  "wav",
    "audio/m4a":    "m4a",
    "audio/x-m4a":  "m4a",
  };
  const ext  = extMap[mimeType] || "webm";
  const file = new File([audioBuffer], `recording.${ext}`, { type: mimeType });

  const transcription = await client.audio.transcriptions.create({
    model: "whisper-1",
    file,
  });

  const text = transcription?.text?.trim() || "";
  if (!text) throw new Error("Whisper returned empty transcription");

  return { text };
}

module.exports = { transcribeWithWhisper };
