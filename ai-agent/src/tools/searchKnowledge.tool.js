/**
 * searchKnowledge.tool.js — RAG retrieval tool
 * ──────────────────────────────────────────────
 * Answers stable knowledge questions: policies, FAQ, store info.
 * The agent calls this ONLY for questions that are clearly not transactional
 * (e.g. "What is your return policy?" — not "What's in my cart?").
 *
 * If retrieval returns nothing useful, the tool says so explicitly.
 * The agent must NOT fabricate policy information.
 */

"use strict";

const { DynamicStructuredTool } = require("@langchain/core/tools");
const { z }                     = require("zod");
const { retrieve }              = require("../rag/retriever");
const aiLogger                  = require("../utils/aiLogger");

function createSearchKnowledgeTool(ctx) {
  return new DynamicStructuredTool({
    name:        "searchKnowledge",
    description: "Look up store policies, FAQs, shipping information, return policy, delivery info, and other stable store knowledge. Do NOT use for live prices, stock, cart, or orders.",
    schema: z.object({
      query: z.string().describe("The user's question about store policies, shipping, returns, or FAQ"),
    }),

    func: async ({ query }) => {
      try {
        const { context, citations, found } = await retrieve(query, {
          requestId: ctx.requestId,
        });

        if (!found || !context.trim()) {
          return JSON.stringify({
            success: false,
            message: "I don't have specific information about that. Please contact support at +91 9142517255.",
            citations: [],
          });
        }

        return JSON.stringify({
          success:  true,
          context,
          citations,
        });
      } catch (err) {
        aiLogger.error("tool.searchKnowledge.error", { requestId: ctx.requestId, error: err.message });
        return JSON.stringify({
          success: false,
          message: "Knowledge base temporarily unavailable. Please contact support.",
          citations: [],
        });
      }
    },
  });
}

module.exports = { createSearchKnowledgeTool };
