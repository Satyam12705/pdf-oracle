import { appConfig } from "@/config/app-config";
import type { PdfPage } from "./pdf";

export interface Chunk {
  id: string;
  docId: string;
  page: number;
  text: string;
}

/**
 * Split each page into overlapping, sentence-aware chunks.
 */
export function chunkPages(docId: string, pages: PdfPage[]): Chunk[] {
  const { chunkSize, overlap, minChars } = appConfig.chunking;
  const chunks: Chunk[] = [];

  for (const { page, text } of pages) {
    if (text.length <= chunkSize) {
      if (text.length >= minChars) {
        chunks.push({ id: `${docId}:${page}:0`, docId, page, text });
      }
      continue;
    }

    let start = 0;
    while (start < text.length) {
      let end = Math.min(start + chunkSize, text.length);
      if (end < text.length) {
        const boundary = Math.max(
          text.lastIndexOf(". ", end),
          text.lastIndexOf("\n", end),
          text.lastIndexOf("? ", end),
          text.lastIndexOf("! ", end),
        );
        if (boundary > start + chunkSize / 2) end = boundary + 1;
      }
      const piece = text.slice(start, end).trim();
      if (piece.length >= minChars) {
        chunks.push({ id: `${docId}:${page}:${start}`, docId, page, text: piece });
      }
      if (end >= text.length) break;
      start = Math.max(0, end - overlap);
    }
  }

  return chunks;
}