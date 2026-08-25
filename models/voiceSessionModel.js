/**
 * Voice Session Model — STM Fruit Shop AI Voice Assistant
 * Stores each voice conversation session with full transcript and metadata
 */
const mongoose = require("mongoose");

const turnSchema = new mongoose.Schema({
  role: { type: String, enum: ["user", "assistant"], required: true },
  text: { type: String, required: true },
  audioUrl: { type: String, default: "" }, // ElevenLabs TTS audio URL (if stored)
  timestamp: { type: Date, default: Date.now },
  confidence: { type: Number, default: 1 }, // Deepgram STT confidence
  intent: { type: String, default: "general" },
  toolCalled: { type: String, default: "" }, // which tool/API was called
  toolResult: { type: mongoose.Schema.Types.Mixed, default: null },
});

const voiceSessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", default: null },
    userAgent: { type: String, default: "" },
    language: { type: String, default: "hi-IN" },
    turns: [turnSchema],
    status: {
      type: String,
      enum: ["active", "ended", "escalated", "abandoned"],
      default: "active",
    },
    escalationReason: { type: String, default: "" },
    totalDurationMs: { type: Number, default: 0 },
    feedbackRating: { type: Number, min: 1, max: 5, default: null },
    feedbackText: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("voiceSession", voiceSessionSchema);
