/**
 * textToSpeech.js — Provider-agnostic TTS abstraction
 * ──────────────────────────────────────────────────────
 * CURRENT STATE:
 *   Returns { text } only — the frontend uses browser SpeechSynthesis to speak it.
 *   This is intentional for Phase 8. Server-side audio generation comes later.
 *
 * FUTURE (Phase 10+):
 *   Set TTS_PROVIDER=openai (or google) in .env.
 *   The speak() function will return { audioBase64, mimeType } or { audioUrl }.
 *   The controller will forward this to the frontend.
 *   ZERO changes needed in agent.js, tools, or the React AI components.
 *
 * WHY THIS ABSTRACTION EXISTS NOW:
 *   If we wire the controller to always call speak() and return its output,
 *   then adding real TTS is just implementing a provider — no restructuring.
 */

"use strict";

/**
 * speak — Convert text to speech output.
 *
 * @param {string} text   The assistant's response text
 * @returns {Promise<TtsResult>}
 *   Phase 8:   { mode: "browser", text }
 *   Phase 10+: { mode: "server", audioBase64, mimeType } | { mode: "url", audioUrl }
 */
async function speak(text) {
  if (!text?.trim()) return { mode: "browser", text: "" };

  const provider = (process.env.TTS_PROVIDER || "browser").toLowerCase().trim();

  switch (provider) {
    case "browser":
      // No server-side audio — frontend handles TTS via Web Speech API
      return { mode: "browser", text };

    case "openai": {
      // Future: generate audio via OpenAI TTS
      // const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      // const mp3 = await openai.audio.speech.create({ model: "tts-1", voice: "alloy", input: text });
      // const buffer = Buffer.from(await mp3.arrayBuffer());
      // return { mode: "server", audioBase64: buffer.toString("base64"), mimeType: "audio/mpeg" };
      throw new Error("TTS_PROVIDER=openai is not yet implemented. Use 'browser'.");
    }

    default:
      throw new Error(`Unknown TTS_PROVIDER: "${provider}". Supported: browser`);
  }
}

module.exports = { speak };
