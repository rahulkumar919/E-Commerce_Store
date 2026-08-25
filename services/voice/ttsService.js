/**
 * TTS Service — ElevenLabs Text-to-Speech
 *
 * Converts AI text responses into natural speech audio (MP3 buffer).
 * Falls back to a silent placeholder if the API key is missing.
 */
const https = require("https");

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
// Default voice: "Aria" — warm, friendly Indian-English accent
const VOICE_ID = process.env.ELEVENLABS_VOICE_ID || "9BWtsMINqrJLrRacOk9x";
const MODEL_ID = "eleven_multilingual_v2";

/**
 * Convert text to speech buffer (MP3)
 * @param {string} text
 * @returns {Promise<Buffer>} MP3 audio buffer
 */
async function textToSpeech(text) {
  if (!ELEVENLABS_API_KEY) {
    console.warn("⚠️  ELEVENLABS_API_KEY missing — returning empty audio");
    return Buffer.alloc(0);
  }

  // Truncate to 2500 chars to stay within limits
  const safeText = text.slice(0, 2500);

  const body = JSON.stringify({
    text: safeText,
    model_id: MODEL_ID,
    voice_settings: {
      stability: 0.5,
      similarity_boost: 0.75,
      style: 0.3,
      use_speaker_boost: true,
    },
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.elevenlabs.io",
      path: `/v1/text-to-speech/${VOICE_ID}`,
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
    };

    const req = https.request(options, (res) => {
      if (res.statusCode !== 200) {
        let err = "";
        res.on("data", (d) => (err += d));
        res.on("end", () =>
          reject(new Error(`ElevenLabs ${res.statusCode}: ${err.slice(0, 200)}`))
        );
        return;
      }

      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => resolve(Buffer.concat(chunks)));
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

module.exports = { textToSpeech };
