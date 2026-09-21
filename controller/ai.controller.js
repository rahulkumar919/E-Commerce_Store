/**
 * ai.controller.js — HTTP entry point for all AI endpoints
 * ──────────────────────────────────────────────────────────
 * ROLE IN MVC:
 *   Controller — thin HTTP glue layer only.
 *   It validates the HTTP request, derives ctx.userId from the already-authenticated
 *   request (never from the request body), calls the agent, and formats the response.
 *   It has ZERO business logic — that lives in agent.js and the service layer.
 *
 * ROUTES HANDLED:
 *   POST /api/ai/chat    — text message → agent response
 *   POST /api/ai/voice   — audio file → STT → agent response
 *
 * SECURITY NOTE:
 *   ctx.userId = req.userId   ← from authToken middleware (JWT-verified)
 *   This line is the code-level guarantee that a user can only act on their own data.
 *   No value from req.body, tool arguments, or LLM output can override it.
 */

"use strict";

const { v4: uuidv4 }         = require("uuid");
const { runAgent }            = require("../ai-agent/src/agent/agent");
const conversationMemory      = require("../ai-agent/src/memory/conversationMemory");
const agentConfig             = require("../ai-agent/src/agent/agentConfig");
const aiLogger                = require("../ai-agent/src/utils/aiLogger");
const { sanitizeString }      = require("../ai-agent/src/utils/sanitize");

// ── POST /api/ai/chat ─────────────────────────────────────────────────────────

async function chatHandler(req, res) {
  const requestId = uuidv4(); // unique ID for tracing this request through logs
  const startMs   = Date.now();

  try {
    // ── 1. Extract inputs ───────────────────────────────────────────────────
    const rawMessage     = req.body?.message;
    const conversationId = req.body?.conversationId || null;

    // ── 2. Validate ─────────────────────────────────────────────────────────
    if (!rawMessage || typeof rawMessage !== "string" || !rawMessage.trim()) {
      return res.status(400).json({
        success: false,
        message: "message field is required and must be a non-empty string",
      });
    }

    const message = sanitizeString(rawMessage.trim()).slice(0, agentConfig.maxUserMessageLength);

    // ── 3. Build context ─────────────────────────────────────────────────────
    // CRITICAL: userId ALWAYS comes from req.userId (set by authToken middleware).
    // It never comes from req.body, query params, or anywhere the client controls.
    const ctx = {
      userId:         req.userId,   // string — guaranteed by authToken
      requestId,
    };

    // ── 4. Load conversation history ─────────────────────────────────────────
    let history = [];
    let activeConversationId = conversationId;

    try {
      const memResult = await conversationMemory.getHistory(req.userId, conversationId);
      history               = memResult.history;
      activeConversationId  = memResult.conversationId;
    } catch (memErr) {
      // Non-fatal: if memory read fails, proceed with empty history
      aiLogger.warn("memory.read_failed", { requestId, error: memErr.message });
      activeConversationId = uuidv4();
    }

    ctx.conversationId = activeConversationId;

    // ── 5. Run the agent ──────────────────────────────────────────────────────
    const result = await runAgent(message, history, ctx);

    // ── 6. Persist the new turn ───────────────────────────────────────────────
    try {
      await conversationMemory.saveHistory(
        req.userId,
        activeConversationId,
        message,
        result.message
      );
    } catch (memErr) {
      // Non-fatal: conversation continues even if history save fails
      aiLogger.warn("memory.write_failed", { requestId, error: memErr.message });
    }

    // ── 7. Return structured response ─────────────────────────────────────────
    return res.status(200).json({
      success:        true,
      message:        result.message,
      products:       result.products  || [],
      cart:           result.cart      || null,
      order:          result.order     || null,
      citations:      result.citations || [],
      conversationId: activeConversationId,
      metadata: {
        usedRag:    result.usedRag    || false,
        toolsUsed:  result.toolsUsed  || [],
        latencyMs:  Date.now() - startMs,
      },
    });

  } catch (err) {
    aiLogger.error("chat.handler_error", { requestId, error: err.message });

    // ── Safe error mapping — never leak internal details ───────────────────
    if (err.message?.includes("timed out")) {
      return res.status(504).json({
        success: false,
        message: "The assistant is taking too long to respond. Please try again.",
      });
    }
    if (err.message?.includes("Message too long")) {
      return res.status(400).json({ success: false, message: err.message });
    }

    // API key missing or invalid
    const isAuthError =
      err.status === 401 ||
      err.statusCode === 401 ||
      /invalid.api.key|api.key.not.set|unauthorized|authentication/i.test(err.message || "");
    if (isAuthError) {
      return res.status(503).json({
        success: false,
        message: "AI assistant is not configured. Please contact the site administrator.",
      });
    }

    // Model not found
    if (/not found|model.*not.*available|ListModels/i.test(err.message || "")) {
      return res.status(503).json({
        success: false,
        message: "AI model is not available. Please contact the site administrator.",
      });
    }

    const isRateLimit =
      err.status === 429 ||
      err.statusCode === 429 ||
      /quota|rate\s*limit|resource_exhausted|too many requests/i.test(err.message || "");

    if (isRateLimit) {
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please wait a moment and try again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "The assistant is temporarily unavailable. Please try again.",
    });
  }
}

// ── POST /api/ai/voice ────────────────────────────────────────────────────────

async function voiceHandler(req, res) {
  const requestId = uuidv4();
  const startMs   = Date.now();

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No audio file received. Send multipart/form-data with field name 'audio'.",
    });
  }

  try {
    const { transcribe } = require("../ai-agent/src/voice/speechToText");
    const { speak }      = require("../ai-agent/src/voice/textToSpeech");

    aiLogger.info("voice.transcribing", { requestId, mimeType: req.file.mimetype, bytes: req.file.size });

    // ── 1. Speech-to-text ───────────────────────────────────────────────────
    const { text } = await transcribe(req.file.buffer, req.file.mimetype);

    if (!text?.trim()) {
      return res.status(422).json({
        success: false,
        message: "No speech detected in the audio. Please try speaking more clearly.",
      });
    }

    aiLogger.info("voice.transcribed", { requestId, text });

    // ── 2. Run through SAME agent path as text chat ──────────────────────────
    const conversationId = req.body?.conversationId || null;

    const ctx = {
      userId:    req.userId,
      requestId,
    };

    let history = [];
    let activeConversationId = conversationId;

    try {
      const memResult       = await conversationMemory.getHistory(req.userId, conversationId);
      history               = memResult.history;
      activeConversationId  = memResult.conversationId;
    } catch (memErr) {
      aiLogger.warn("memory.read_failed", { requestId, error: memErr.message });
      activeConversationId = uuidv4();
    }

    ctx.conversationId = activeConversationId;

    const result = await runAgent(text, history, ctx);

    try {
      await conversationMemory.saveHistory(req.userId, activeConversationId, text, result.message);
    } catch (memErr) {
      aiLogger.warn("memory.write_failed", { requestId, error: memErr.message });
    }

    // ── 3. TTS: generate audio or return text for browser Speech API ─────────
    const ttsResult = await speak(result.message);

    return res.status(200).json({
      success:        true,
      transcribedText: text,
      message:        result.message,
      products:       result.products  || [],
      cart:           result.cart      || null,
      order:          result.order     || null,
      citations:      result.citations || [],
      conversationId: activeConversationId,
      tts:            ttsResult,   // { mode:"browser",text } or { mode:"server",audioBase64,mimeType }
      metadata: {
        usedRag:   result.usedRag   || false,
        toolsUsed: result.toolsUsed || [],
        latencyMs: Date.now() - startMs,
      },
    });

  } catch (err) {
    aiLogger.error("voice.handler_error", { requestId, error: err.message });

    if (err.message?.includes("OPENAI_API_KEY")) {
      return res.status(503).json({
        success: false,
        message: "Voice transcription is not configured on this server. Please type your message instead.",
      });
    }
    if (err.message?.includes("empty transcription")) {
      return res.status(422).json({
        success: false,
        message: "Could not understand the audio. Please speak clearly or type your message.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Voice processing failed. Please type your message instead.",
    });
  }
}

// ── POST /api/ai/conversation ──────────────────────────────────────────────────

async function createConversationHandler(req, res) {
  try {
    const memResult = await conversationMemory.getHistory(req.userId);
    return res.status(200).json({
      success: true,
      conversationId: memResult.conversationId,
    });
  } catch (err) {
    aiLogger.error("conversation.create_error", { error: err.message });
    return res.status(500).json({
      success: false,
      message: "Could not initialize conversation",
    });
  }
}

// ── GET /api/ai/conversation/:conversationId ────────────────────────────────────

async function getConversationHandler(req, res) {
  try {
    const { conversationId } = req.params;
    const memResult = await conversationMemory.getHistory(req.userId, conversationId);
    return res.status(200).json({
      success: true,
      conversationId: memResult.conversationId,
      messages: memResult.history,
    });
  } catch (err) {
    aiLogger.error("conversation.get_error", { error: err.message });
    return res.status(500).json({
      success: false,
      message: "Could not retrieve conversation history",
    });
  }
}

module.exports = {
  chatHandler,
  voiceHandler,
  createConversationHandler,
  getConversationHandler,
};
