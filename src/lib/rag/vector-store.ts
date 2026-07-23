import { get, set, del } from "idb-keyval";
import type { Chunk } from "./chunking";

export interface DocumentRecord {
  id: string;
  name: string;
  pages: number;
  chunkCount: number;
  createdAt: number;
  sizeBytes: number;
}

export interface IndexedChunk extends Chunk {
  /** Stored as plain array for JSON-friendly persistence in IndexedDB. */
  embedding: number[];
}

const DOCS_KEY = "qa.docs.list.v1";
const chunksKey = (docId: string) => `qa.docs.chunks.v1.${docId}`;

export async function listDocuments(): Promise<DocumentRecord[]> {
  return (await get<DocumentRecord[]>(DOCS_KEY)) ?? [];
}

export async function saveDocument(
  doc: DocumentRecord,
  chunks: IndexedChunk[],
): Promise<void> {
  const existing = await listDocuments();
  const next = [...existing.filter((d) => d.id !== doc.id), doc].sort(
    (a, b) => b.createdAt - a.createdAt,
  );
  await set(DOCS_KEY, next);
  await set(chunksKey(doc.id), chunks);
}

export async function deleteDocument(id: string): Promise<void> {
  const existing = await listDocuments();
  await set(
    DOCS_KEY,
    existing.filter((d) => d.id !== id),
  );
  await del(chunksKey(id));
}

export async function hasDocumentByHash(hash: string): Promise<DocumentRecord | null> {
  const docs = await listDocuments();
  return docs.find((d) => d.id === hash) ?? null;
}

async function getChunks(id: string): Promise<IndexedChunk[]> {
  return (await get<IndexedChunk[]>(chunksKey(id))) ?? [];
}

export async function getAllChunks(): Promise<IndexedChunk[]> {
  const docs = await listDocuments();
  const groups = await Promise.all(docs.map((d) => getChunks(d.id)));
  return groups.flat();
}

function cosine(a: ArrayLike<number>, b: ArrayLike<number>): number {
  // Both vectors are unit-normalized -> dot product == cosine similarity.
  let dot = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) dot += a[i] * b[i];
  return dot;
}

export interface SearchResult {
  chunk: IndexedChunk;
  score: number;
  docName: string;
}

export async function search(
  queryEmbedding: Float32Array,
  topK: number,
): Promise<SearchResult[]> {
  const docs = await listDocuments();
  const nameById = new Map(docs.map((d) => [d.id, d.name]));
  const chunks = await getAllChunks();
  const scored = chunks.map((chunk) => ({
    chunk,
    score: cosine(queryEmbedding, chunk.embedding),
    docName: nameById.get(chunk.docId) ?? "Unknown",
  }));
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}

/** Stable content hash so re-uploading the same PDF reuses its index. */
export async function hashFile(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buf);
  const bytes = new Uint8Array(digest);
  let hex = "";
  for (const b of bytes) hex += b.toString(16).padStart(2, "0");
  return hex.slice(0, 24);
}