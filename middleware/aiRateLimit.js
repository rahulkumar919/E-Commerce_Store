/**
 * aiRateLimit.js — Rate limiting for AI endpoints
 * ─────────────────────────────────────────────────
 * WHY A SEPARATE FILE:
 * AI endpoints are expensive (LLM tokens, Pinecone queries).
 * They need tighter limits than normal REST endpoints.
 * Keeping this in its own file makes it easy to tune independently.
 *
 * STRATEGY:
 *   chatLimiter  — 30 requests / minute per user (identified by IP + userId cookie)
 *   voiceLimiter — 10 requests / minute per user (audio uploads are more expensive)
 *
 * HOW USER IS IDENTIFIED:
 *   keyGenerator reads req.userId (set by authToken middleware — comes before this).
 *   Falls back to IP address if req.userId is not yet set (shouldn't happen on auth routes).
 *
 * PRODUCTION NOTE:
 *   If running behind a load balancer / Vercel, switch store to a shared Redis store
 *   so limits are per-user across instances, not just per-process:
 *     npm install rate-limit-redis
 *     store: new RedisStore({ sendCommand: (...args) => redisClient.call(...args) })
 */

"use strict";

const rateLimit = require("express-rate-limit");

/**
 * makeAILimiter — Helper that creates a limiter with consistent error format.
 *
 * @param {{ max: number, windowMinutes: number, message: string }} opts
 */
function makeAILimiter({ max, windowMinutes, message }) {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    standardHeaders: true,   // Return RateLimit-* headers
    legacyHeaders:   false,   // Disable X-RateLimit-* headers

    // Use authenticated userId if available, otherwise fall back to IP
    keyGenerator: (req) => {
      return req.userId ? `user:${req.userId}` : `ip:${req.ip}`;
    },

    // Return our standard JSON error format instead of the default text
    handler: (req, res) => {
      return res.status(429).json({
        success: false,
        message,
      });
    },
  });
}

const isDev = process.env.NODE_ENV !== "production";

const chatLimiter = makeAILimiter({
  max:           parseInt(process.env.AI_CHAT_RATE_LIMIT  || (isDev ? "120" : "30"), 10),
  windowMinutes: parseInt(process.env.AI_RATE_WINDOW_MINS || "1",  10),
  message:       "Too many requests. Please wait a moment before sending another message.",
});

const voiceLimiter = makeAILimiter({
  max:           parseInt(process.env.AI_VOICE_RATE_LIMIT || (isDev ? "60" : "10"), 10),
  windowMinutes: parseInt(process.env.AI_RATE_WINDOW_MINS || "1",  10),
  message:       "Too many voice requests. Please wait a moment before trying again.",
});

module.exports = { chatLimiter, voiceLimiter };
