/**
 * ChatSession.js — Conversation memory persistence model
 * ───────────────────────────────────────────────────────
 * Stores bounded conversation history per user/session in MongoDB.
 *
 * WHY MONGODB AND NOT IN-MEMORY:
 * The backend runs on Vercel (serverless). In-memory Maps disappear between cold
 * starts — any OTP/session stored in a Map is already gone on the next request.
 * MongoDB gives us durable history without running a Redis conversation store.
 *
 * SCHEMA DECISIONS:
 * - messages[] is an array of { role, content, timestamp } — not a full LangChain
 *   message object, so it stays serializable and provider-agnostic.
 * - maxMessages is enforced by conversationMemory.js, not the schema, so we can
 *   change the window size without a DB migration.
 * - updatedAt auto-updates for cheap "stale conversation" cleanup queries.
 * - One session per (userId + conversationId) pair — same user can have multiple
 *   concurrent conversations (e.g. mobile + desktop).
 *
 * RELATED: backend/ai-agent/src/memory/conversationMemory.js reads/writes this.
 */

"use strict";

const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    role:    { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true },
  },
  { _id: false, timestamps: { createdAt: "timestamp", updatedAt: false } }
);

const chatSessionSchema = new mongoose.Schema(
  {
    // Which user owns this session
    userId: {
      type: String, // stored as string to match how authToken sets req.userId
      required: true,
      index: true,
    },

    // Client-generated or server-generated UUID
    conversationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    // Bounded history — conversationMemory.js enforces the cap
    messages: {
      type: [messageSchema],
      default: [],
    },
  },
  {
    timestamps: true, // adds createdAt + updatedAt
  }
);

// Compound index for the most common query: "get session for this user+conversation"
chatSessionSchema.index({ userId: 1, conversationId: 1 });

// Auto-expire stale sessions after 30 days of inactivity (TTL index)
// Change the value or remove the index if you want permanent history.
chatSessionSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const ChatSession = mongoose.model("ChatSession", chatSessionSchema);

module.exports = ChatSession;
