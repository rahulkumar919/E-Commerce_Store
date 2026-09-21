/**
 * aiRoutes.js — AI endpoint routes
 * ──────────────────────────────────
 * Mounts under /api/ai (see index.js: app.use("/api/ai", aiRouter))
 *
 * Every route is protected by the existing authToken middleware.
 * Rate limiters sit between authToken and the handler to use req.userId as the key.
 *
 * ROUTES:
 *   POST /api/ai/chat    — text message → agent response
 *   POST /api/ai/voice   — audio file → STT → agent response
 */

"use strict";

const express    = require("express");
const multer     = require("multer");
const authToken  = require("../middleware/authToken");
const { chatLimiter, voiceLimiter } = require("../middleware/aiRateLimit");
const {
  chatHandler,
  voiceHandler,
  createConversationHandler,
  getConversationHandler,
} = require("../controller/ai.controller");

const router = express.Router();

// ── Multer — memory storage for voice uploads ─────────────────────────────────
// We store in memory (not disk) because files are sent directly to STT.
// Max file size prevents abuse.
const MAX_MB = parseInt(process.env.AUDIO_MAX_SIZE_MB || "10", 10);
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // Accept common audio MIME types; reject everything else
    const allowed = ["audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg",
                     "audio/wav", "audio/x-wav", "audio/m4a", "audio/x-m4a"];
    if (allowed.includes(file.mimetype) || file.mimetype.startsWith("audio/")) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported audio format: ${file.mimetype}`));
    }
  },
});

// ── Text chat — auth + rate limit + handler ───────────────────────────────────
router.post("/chat", authToken, chatLimiter, chatHandler);

// ── Conversation management ───────────────────────────────────────────────────
router.post("/conversation", authToken, createConversationHandler);
router.get("/conversation/:conversationId", authToken, getConversationHandler);

// ── Voice chat — auth + rate limit + multer + handler ────────────────────────
router.post(
  "/voice",
  authToken,
  (req, res, next) => {
    // Wrap multer error so it's caught before our voiceHandler
    upload.single("audio")(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          message: err.code === "LIMIT_FILE_SIZE"
            ? `Audio file too large. Maximum size: ${MAX_MB}MB`
            : `Upload error: ${err.message}`,
        });
      }
      if (err) {
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  },
  voiceLimiter,
  voiceHandler
);

module.exports = router;
