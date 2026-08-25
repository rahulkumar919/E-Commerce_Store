/**
 * STT Service — Deepgram Speech-to-Text
 *
 * Transcribes audio buffers (WebM/WAV/MP3) to text.
 * Uses the Deepgram Nova-2 model which handles Hinglish well.
 */
const https = require("https");

const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

/**
 * Transcribe audio buffer to text
 * @param {Buffer} audioBuffer  Raw audio bytes (webm/wav/mp3)
 * @param {string} mimeType     e.g. "audio/webm" or "audio/wav"
 * @returns {Promise<{ transcript: string, confidence: number }>}
 */
async function transcribeAudio(audioBuffer, mimeType = "audio/webm") {
  if (!DEEPGRAM_API_KEY) {
    throw new Error("DEEPGRAM_API_KEY is not configured");
  }

  if (!audioBuffer || audioBuffer.length === 0) {
    throw new Error("Empty audio buffer");
  }

  return new Promise((resolve, reject) => {
    const queryParams = new URLSearchParams({
      model: "nova-2",
      language: "hi-Latn",   // Hinglish (Hindi in Latin script + English)
      smart_format: "true",
      punctuate: "true",
      filler_words: "false",
      utterances: "false",
    }).toString();

    const options = {
      hostname: "api.deepgram.com",
      path: `/v1/listen?${queryParams}`,
      method: "POST",
      headers: {
        Authorization: `Token ${DEEPGRAM_API_KEY}`,
        "Content-Type": mimeType,
        "Content-Length": audioBuffer.length,
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);

          if (res.statusCode !== 200) {
            return reject(
              new Error(`Deepgram ${res.statusCode}: ${JSON.stringify(parsed).slice(0, 200)}`)
            );
          }

          const result = parsed?.results?.channels?.[0]?.alternatives?.[0];
          const transcript = result?.transcript?.trim() || "";
          const confidence = result?.confidence || 0;

          resolve({ transcript, confidence });
        } catch (e) {
          reject(new Error(`Failed to parse Deepgram response: ${e.message}`));
        }
      });
    });

    req.on("error", reject);
    req.write(audioBuffer);
    req.end();
  });
}

module.exports = { transcribeAudio };
