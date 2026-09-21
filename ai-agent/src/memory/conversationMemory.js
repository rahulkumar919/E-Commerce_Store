/**
 * conversationMemory.js — Bounded conversation history
 * ──────────────────────────────────────────────────────
 * Reads and writes ChatSession documents.
 * Enforces a sliding window so the agent's context never grows unbounded.
 *
 * WHY BOUNDED:
 * Each token in the context costs money and latency. Unbounded history quickly
 * exceeds model context limits. We keep the most recent N turns and truncate older
 * ones. In a production upgrade you'd summarise the dropped history and prepend
 * the summary instead of discarding it — that's easy to add later without changing
 * this interface (just replace the slice logic with a summarisation call).
 *
 * MEMORY ISOLATION:
 * getHistory() takes BOTH userId AND conversationId.
 * If the conversationId belongs to a different userId, it returns [] — no cross-user
 * leakage regardless of what the front-end sends.
 */

"use strict";

const { v4: uuidv4 }    = require("uuid");
const ChatSession       = require("../../../models/ChatSession");
const agentConfig       = require("../agent/agentConfig");

// maxHistoryTurns: each "turn" = 1 user message + 1 assistant message = 2 records
const MAX_MESSAGES = agentConfig.maxHistoryTurns * 2;

/**
 * getOrCreateSession — fetch an existing session or create a new one.
 * Always validates userId ownership.
 *
 * @param {string} userId
 * @param {string} [conversationId]   If omitted, a new UUID is generated
 * @returns {Promise<{ session: ChatSession, conversationId: string }>}
 */
async function getOrCreateSession(userId, conversationId) {
  if (!conversationId) {
    // New conversation — generate a server-side ID so we control the namespace
    const newId = uuidv4();
    const session = await ChatSession.create({
      userId,
      conversationId: newId,
      messages: [],
    });
    return { session, conversationId: newId };
  }

  // Existing conversation — find it AND verify userId ownership
  let session = await ChatSession.findOne({ conversationId, userId });

  if (!session) {
    // Either it doesn't exist yet, or it belongs to a different user.
    // In both cases, start fresh — never return another user's history.
    const safeId = uuidv4();
    session = await ChatSession.create({
      userId,
      conversationId: safeId,
      messages: [],
    });
    return { session, conversationId: safeId };
  }

  return { session, conversationId };
}

/**
 * getHistory — Return the bounded message array for the agent context.
 * Returns plain objects [{ role, content }], not Mongoose documents.
 *
 * @param {string} userId
 * @param {string} [conversationId]
 * @returns {Promise<{ history: object[], conversationId: string }>}
 */
async function getHistory(userId, conversationId) {
  const { session, conversationId: cid } = await getOrCreateSession(userId, conversationId);
  // Apply window — keep the most recent MAX_MESSAGES entries
  const history = session.messages.slice(-MAX_MESSAGES).map((m) => ({
    role:    m.role,
    content: m.content,
  }));
  return { history, conversationId: cid };
}

/**
 * saveHistory — Append a user + assistant turn to the session.
 * Trims to MAX_MESSAGES after appending (sliding window).
 *
 * @param {string} userId
 * @param {string} conversationId
 * @param {string} userMessage
 * @param {string} assistantMessage
 */
async function saveHistory(userId, conversationId, userMessage, assistantMessage) {
  const session = await ChatSession.findOne({ conversationId, userId });
  if (!session) return; // safety — shouldn't happen if getHistory was called first

  session.messages.push(
    { role: "user",      content: userMessage      },
    { role: "assistant", content: assistantMessage  }
  );

  // Enforce the sliding window — drop oldest messages beyond MAX_MESSAGES
  if (session.messages.length > MAX_MESSAGES) {
    session.messages = session.messages.slice(-MAX_MESSAGES);
  }

  await session.save();
}

/**
 * clearHistory — Wipe a conversation (user-initiated "New conversation").
 * Only clears sessions that belong to the requesting userId.
 *
 * @param {string} userId
 * @param {string} conversationId
 */
async function clearHistory(userId, conversationId) {
  await ChatSession.deleteOne({ conversationId, userId });
}

module.exports = { getHistory, saveHistory, clearHistory };
