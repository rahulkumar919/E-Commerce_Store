const DEFAULT_OLLAMA_URL = "http://127.0.0.1:11434";

function ollamaUrl() {
  return (process.env.OLLAMA_BASE_URL || DEFAULT_OLLAMA_URL).replace(/\/$/, "");
}

async function ollamaRequest(path, body) {
  const response = await fetch(`${ollamaUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Ollama ${response.status}: ${detail.slice(0, 300)}`);
  }

  return response.json();
}

async function chat(messages, options = {}) {
  const result = await ollamaRequest("/api/chat", {
    model: process.env.OLLAMA_CHAT_MODEL || "llama3.2:1b",
    messages,
    tools: options.tools,
    stream: false,
    keep_alive: process.env.OLLAMA_KEEP_ALIVE || "10m",
    options: {
      temperature: Number(process.env.OLLAMA_TEMPERATURE || 0.3),
      num_ctx: Number(process.env.OLLAMA_CONTEXT_LENGTH || 4096),
      num_predict: Number(process.env.OLLAMA_MAX_TOKENS || 256),
    },
  });

  return result.message || { role: "assistant", content: "" };
}

async function warmup() {
  await ollamaRequest("/api/generate", {
    model: process.env.OLLAMA_CHAT_MODEL || "llama3.2:1b",
    prompt: "",
    stream: false,
    keep_alive: process.env.OLLAMA_KEEP_ALIVE || "10m",
    options: { num_predict: 1 },
  });
}

async function embed(input) {
  const result = await ollamaRequest("/api/embed", {
    model: process.env.OLLAMA_EMBEDDING_MODEL || "nomic-embed-text",
    input,
  });

  const embeddings = result.embeddings || [];
  if (!embeddings.length || !embeddings[0]?.length) {
    throw new Error("Ollama returned no embeddings");
  }
  return embeddings;
}

module.exports = { chat, embed, warmup, ollamaUrl };
