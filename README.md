# Document Q&A

A production-quality Retrieval-Augmented Generation (RAG) app: upload PDFs, ask
natural-language questions, and get answers grounded strictly in the uploaded
documents — with source citations and page numbers.

## Features

- Drag-and-drop multi-PDF upload with progress
- Client-side PDF text extraction (pdfjs-dist)
- Sentence-aware overlapping chunking
- Semantic embeddings computed **in the browser** with `Xenova/all-MiniLM-L6-v2`
- Local vector index persisted in IndexedDB (no rebuild on reload)
- Cosine similarity retrieval, top-K + score threshold
- OpenRouter LLM answers, strictly instructed to use only retrieved context
- Collapsible source panel per answer (doc name, page, relevance score, passage)
- Chat interface with history, auto-scroll, typing indicator, timestamps
- Dashboard stats (documents, pages, chunks, questions)
- Dark mode, responsive, graceful error handling

## Environment

Set the OpenRouter API key as an environment variable (server-side only):

```
OPENROUTER_API_KEY=sk-or-...
```

On Lovable, add it in **Project Settings → Secrets**. Locally, add it to `.env`.

## Running locally

```bash
bun install
bun dev
```

## Configuration

All tunable knobs live in `src/config/app-config.ts`:

```ts
openrouter.model          // any OpenRouter chat model id
embedding.model           // browser embedding model
chunking.chunkSize        // ~chars per chunk
chunking.overlap          // char overlap between chunks
retrieval.topK            // number of chunks retrieved
retrieval.minScore        // similarity threshold
```

## Folder structure

```
src/
  config/app-config.ts        # single-source configuration
  lib/
    rag/pdf.ts                # PDF text extraction
    rag/chunking.ts           # overlapping chunker
    rag/embeddings.ts         # transformers.js pipeline
    rag/vector-store.ts       # IndexedDB store + cosine search
    ask.functions.ts          # TanStack server fn → OpenRouter
  hooks/
    use-documents.ts          # upload pipeline + state
    use-theme.ts              # dark/light toggle
  components/qa/              # UI: upload, list, chat, sources, stats
  routes/index.tsx            # main page
```

## Future improvements

- Streaming responses
- Hybrid retrieval (BM25 + vector)
- Per-document filters in the chat
- OCR fallback for scanned PDFs
- Export/share conversations