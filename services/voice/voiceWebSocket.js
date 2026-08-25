/**
 * Voice WebSocket Server — STM Fruit Shop
 *
 * Protocol (binary + JSON messages over ws://):
 *
 * Client → Server:
 *   { type: "start", sessionId, userId, language }   — start session
 *   { type: "audio", data: <base64> }                — send audio chunk
 *   { type: "end_audio" }                            — done speaking
 *   { type: "text", text }                           — skip STT, send text directly
 *   { type: "end_session" }                          — close session
 *
 * Server → Client:
 *   { type: "session_started", sessionId }
 *   { type: "transcript", text, confidence }         — STT result
 *   { type: "thinking" }                             — AI processing
 *   { type: "response_text", text, toolCalled }      — AI text response
 *   { type: "audio_chunk", data: <base64> }          — TTS audio (MP3)
 *   { type: "error", message }
 *   { type: "session_ended" }
 */

const WebSocket = require("ws");
const { transcribeAudio } = require("./sttService");
const { textToSpeech } = require("./ttsService");
const { processVoiceQuery, clearSession } = require("./voiceAgentService");
const VoiceSession = require("../../models/voiceSessionModel");

/**
 * Attach a WebSocket server to an existing HTTP server
 * @param {import('http').Server} httpServer
 */
function attachVoiceWebSocket(httpServer) {
  const wss = new WebSocket.Server({ server: httpServer, path: "/ws/voice" });

  console.log("🎙️  Voice WebSocket server ready on /ws/voice");

  wss.on("connection", (ws, req) => {
    console.log("🔌 Voice WS client connected");

    let sessionId = null;
    let userId = null;
    let audioChunks = []; // Collect audio chunks until end_audio
    let sessionStartTime = Date.now();
    let dbSession = null;

    // ── Message handler ────────────────────────────────────────────────────
    ws.on("message", async (rawMessage) => {
      let msg;
      try {
        msg = JSON.parse(rawMessage.toString());
      } catch {
        send(ws, { type: "error", message: "Invalid JSON message" });
        return;
      }

      // ── START SESSION ──────────────────────────────────────────────────
      if (msg.type === "start") {
        sessionId = msg.sessionId || `voice_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        userId = msg.userId || null;

        // Create DB record
        try {
          dbSession = await VoiceSession.create({
            sessionId,
            userId,
            language: msg.language || "hi-IN",
            userAgent: req.headers["user-agent"] || "",
          });
        } catch (e) {
          console.warn("DB session create error:", e.message);
        }

        send(ws, { type: "session_started", sessionId });
        console.log(`✅ Voice session started: ${sessionId}`);
        return;
      }

      // ── AUDIO CHUNK ────────────────────────────────────────────────────
      if (msg.type === "audio") {
        if (!msg.data) return;
        try {
          const chunk = Buffer.from(msg.data, "base64");
          audioChunks.push(chunk);
        } catch {
          send(ws, { type: "error", message: "Invalid audio data" });
        }
        return;
      }

      // ── END AUDIO → STT → AI → TTS ────────────────────────────────────
      if (msg.type === "end_audio") {
        if (audioChunks.length === 0) {
          send(ws, { type: "error", message: "No audio received" });
          return;
        }

        const audioBuffer = Buffer.concat(audioChunks);
        audioChunks = [];

        try {
          // Step 1: STT
          send(ws, { type: "thinking" });
          const { transcript, confidence } = await transcribeAudio(
            audioBuffer,
            msg.mimeType || "audio/webm"
          );

          if (!transcript) {
            send(ws, { type: "error", message: "Could not understand audio. Please speak again." });
            return;
          }

          send(ws, { type: "transcript", text: transcript, confidence });
          console.log(`📝 Transcript: "${transcript}" (${(confidence * 100).toFixed(0)}%)`);

          // Step 2: AI
          await handleTextQuery(ws, transcript, sessionId, userId, dbSession);
        } catch (err) {
          console.error("STT error:", err.message);
          send(ws, { type: "error", message: `Speech recognition failed: ${err.message}` });
        }
        return;
      }

      // ── TEXT INPUT (skip STT) ──────────────────────────────────────────
      if (msg.type === "text") {
        if (!msg.text?.trim()) return;
        send(ws, { type: "thinking" });
        await handleTextQuery(ws, msg.text.trim(), sessionId, userId, dbSession);
        return;
      }

      // ── END SESSION ────────────────────────────────────────────────────
      if (msg.type === "end_session") {
        await endSession(ws, sessionId, dbSession, Date.now() - sessionStartTime);
        return;
      }
    });

    // ── Client disconnect ──────────────────────────────────────────────────
    ws.on("close", async () => {
      if (sessionId) {
        await endSession(null, sessionId, dbSession, Date.now() - sessionStartTime);
      }
      console.log("🔌 Voice WS client disconnected");
    });

    ws.on("error", (err) => {
      console.error("WS error:", err.message);
    });
  });

  return wss;
}

// ── Core: text → AI → TTS ──────────────────────────────────────────────────
async function handleTextQuery(ws, text, sessionId, userId, dbSession) {
  try {
    // Step 1: AI Agent
    const agentResult = await processVoiceQuery({ text, sessionId, userId });
    const responseText = agentResult.text;

    // Step 2: Send text response
    send(ws, {
      type: "response_text",
      text: responseText,
      toolCalled: agentResult.toolCalled,
      toolResult: agentResult.toolResult,
      ragUsed: agentResult.ragUsed,
    });

    // Step 3: TTS → stream audio back
    if (process.env.ELEVENLABS_API_KEY) {
      try {
        const audioBuffer = await textToSpeech(responseText);
        if (audioBuffer.length > 0) {
          // Send in 16KB chunks for smooth streaming
          const CHUNK_SIZE = 16 * 1024;
          for (let i = 0; i < audioBuffer.length; i += CHUNK_SIZE) {
            const chunk = audioBuffer.subarray(i, i + CHUNK_SIZE);
            send(ws, {
              type: "audio_chunk",
              data: chunk.toString("base64"),
              isLast: i + CHUNK_SIZE >= audioBuffer.length,
            });
          }
        }
      } catch (ttsErr) {
        console.warn("TTS error (non-fatal):", ttsErr.message);
        // Still sent text response — client can use browser TTS as fallback
      }
    }

    // Step 4: Persist turn to DB
    if (dbSession) {
      try {
        await VoiceSession.findByIdAndUpdate(dbSession._id, {
          $push: {
            turns: {
              $each: [
                { role: "user", text, intent: "voice" },
                {
                  role: "assistant",
                  text: responseText,
                  toolCalled: agentResult.toolCalled || "",
                  toolResult: agentResult.toolResult,
                },
              ],
            },
          },
        });
      } catch (e) {
        // non-fatal
      }
    }
  } catch (err) {
    console.error("handleTextQuery error:", err.message);
    send(ws, {
      type: "error",
      message: "AI processing failed. Please try again.",
    });
  }
}

async function endSession(ws, sessionId, dbSession, durationMs) {
  if (sessionId) clearSession(sessionId);
  if (dbSession) {
    try {
      await VoiceSession.findByIdAndUpdate(dbSession._id, {
        status: "ended",
        totalDurationMs: durationMs,
      });
    } catch {}
  }
  if (ws && ws.readyState === WebSocket.OPEN) {
    send(ws, { type: "session_ended" });
  }
}

function send(ws, payload) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

module.exports = { attachVoiceWebSocket };
