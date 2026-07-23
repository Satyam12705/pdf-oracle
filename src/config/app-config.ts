/**
 * Central configuration for the Document Q&A system.
 * Change model / retrieval / chunking behavior here — nothing else needs to change.
 */
export const appConfig = {
  app: {
    name: "Document Q&A",
    tagline: "Ask anything. Answers grounded in your PDFs.",
  },
  openrouter: {
    /** Any OpenRouter chat-completion model id. */
    model: "openai/gpt-4o-mini",
    baseUrl: "https://openrouter.ai/api/v1",
    temperature: 0.15,
    maxTokens: 900,
  },
  embedding: {
    /** Runs fully in the browser via transformers.js — no server key needed. */
    model: "Xenova/all-MiniLM-L6-v2",
    dimensions: 384,
  },
  chunking: {
    /** Approximate characters per chunk. */
    chunkSize: 900,
    /** Overlap keeps context across chunk boundaries. */
    overlap: 150,
    /** Ignore very short fragments. */
    minChars: 40,
  },
  retrieval: {
    topK: 5,
    /** Score floor for a chunk to count as relevant. */
    minScore: 0.28,
  },
} as const;

export type AppConfig = typeof appConfig;