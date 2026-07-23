# PDF Oracle — Document Q&A

A production-ready Retrieval-Augmented Generation (RAG) web application: upload PDFs, ask natural-language questions, and get precise answers grounded strictly in your documents — complete with page numbers and source citations.

![Favicon Banner](./public/favicon.svg)

## 🌟 Features

- **Multi-PDF Upload**: Drag-and-drop support with real-time extraction progress.
- **Client-Side Processing**: Browser-based PDF text extraction (`pdfjs-dist`).
- **Semantic Vector Indexing**: Computes text embeddings **in the browser** via `@xenova/transformers` (`Xenova/all-MiniLM-L6-v2`).
- **IndexedDB Persistence**: Vector store is saved locally in IndexedDB (no re-indexing needed on refresh).
- **Cosine Similarity Search**: Top-K retrieval with relevance score thresholds.
- **OpenRouter LLM Integration**: Strictly grounded answers using OpenRouter models.
- **Interactive Citations**: Per-answer source cards showing document name, page number, relevance score, and passage snippet.
- **Responsive Theme**: Dark/light mode support with an elegant indigo/violet design system.

---

## 🚀 Deployment Guide

### Option 1: Deploy to Vercel (Recommended)

1. Push this repository to GitHub (see instructions below).
2. Go to [Vercel Dashboard](https://vercel.com/new) and import your repository.
3. Add the following Environment Variable in Vercel settings:
   - `OPENROUTER_API_KEY`: Your OpenRouter API Key (e.g. `sk-or-v1-...`)
4. Click **Deploy**. Vercel will automatically build and deploy your application.

### Option 2: Deploy to Netlify / Render / Cloudflare Pages

1. Import the repository into your preferred host.
2. Build command: `npm run build`
3. Output directory: `.output/public`
4. Set `OPENROUTER_API_KEY` in environment variables.

---

## 📦 Pushing to GitHub

Run the following commands in your terminal to connect this repository to GitHub:

```bash
# 1. Create a new repository on GitHub (https://github.com/new)

# 2. Add your remote repository URL
git remote add origin https://github.com/YOUR_USERNAME/pdf-oracle.git

# 3. Rename branch to main if not already
git branch -M main

# 4. Push your code
git push -u origin main
```

---

## 🛠️ Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/pdf-oracle.git
   cd pdf-oracle
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or
   bun install
   ```

3. **Environment Setup**:
   Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Add your OpenRouter API Key to `.env`:
   ```env
   OPENROUTER_API_KEY=sk-or-v1-...
   ```

4. **Run Dev Server**:
   ```bash
   npm run dev
   ```

---

## 📁 Project Structure

```
pdf-oracle/
├── public/
│   ├── favicon.svg           # High-resolution vector favicon
│   └── favicon.ico           # Legacy favicon fallback
├── src/
│   ├── config/app-config.ts  # Tunable RAG parameters & models
│   ├── components/qa/        # Chat, upload, sources, stats UI components
│   ├── hooks/                # Custom React hooks (use-documents, use-theme)
│   ├── lib/rag/              # Extraction, chunking, embeddings, vector store
│   ├── routes/               # TanStack Router pages & root layout
│   └── server.ts             # SSR server entry point
├── vercel.json               # Vercel deployment configuration
├── .env.example              # Environment variables template
└── vite.config.ts            # Vite & Nitro build setup
```

---

## 📄 License

MIT License. Free for personal and commercial use.