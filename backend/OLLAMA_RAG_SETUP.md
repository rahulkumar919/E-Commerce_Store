# Ollama RAG Agent

The `/api/ai/chat-enhanced` endpoint now uses an Ollama chat model for generation and `nomic-embed-text` for embeddings. Pinecone stores the embedded knowledge-base chunks.

## Local setup

1. Install and start Ollama: `ollama serve`
2. Pull the models:

```text
ollama pull llama3.2:latest
ollama pull nomic-embed-text
```

3. Confirm `backend/.env` contains `OLLAMA_BASE_URL`, `OLLAMA_CHAT_MODEL`, `OLLAMA_EMBEDDING_MODEL`, and `OLLAMA_KEEP_ALIVE`.
4. Re-index the knowledge base after changing embedding models:

```text
cd backend
npm run setup-rag-enhanced
```

5. Start the API with `npm run dev`.

The LLM decides whether to answer directly or call `searchProducts`, `searchKnowledge`, `getProduct`, `getCart`, `addToCart`, or `removeFromCart`. Cart tools require the authenticated user from the request; a client-supplied `userId` is ignored.

Pinecone must use the `stm-ollama-rag` dense index with the same dimension returned by `nomic-embed-text` (768) and cosine similarity. Do not reuse an index configured for Pinecone integrated text search.
