import { useCallback, useEffect, useState } from "react";

import { appConfig } from "@/config/app-config";
import { chunkPages } from "@/lib/rag/chunking";
import { embedTexts } from "@/lib/rag/embeddings";
import { extractPdfPages } from "@/lib/rag/pdf";
import {
  deleteDocument,
  hasDocumentByHash,
  hashFile,
  listDocuments,
  saveDocument,
  type DocumentRecord,
  type IndexedChunk,
} from "@/lib/rag/vector-store";

export interface UploadProgress {
  fileName: string;
  stage: "reading" | "chunking" | "embedding" | "saving" | "done" | "error";
  progress: number; // 0..1
  message?: string;
}

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [uploads, setUploads] = useState<Record<string, UploadProgress>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const list = await listDocuments();
    setDocuments(list);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const setUpload = (key: string, p: Partial<UploadProgress>) =>
    setUploads((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? { fileName: key, stage: "reading", progress: 0 }), ...p },
    }));

  const removeUpload = (key: string) =>
    setUploads((prev) => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });

  const upload = useCallback(
    async (file: File) => {
      const key = `${file.name}-${file.size}-${Date.now()}`;
      setUpload(key, { fileName: file.name, stage: "reading", progress: 0.02 });
      try {
        if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
          throw new Error("Only PDF files are supported.");
        }
        if (file.size === 0) throw new Error("This file is empty.");

        const hash = await hashFile(file);
        const existing = await hasDocumentByHash(hash);
        if (existing) {
          setUpload(key, {
            stage: "done",
            progress: 1,
            message: "Already indexed — reused existing embeddings.",
          });
          setTimeout(() => removeUpload(key), 1500);
          await refresh();
          return existing;
        }

        setUpload(key, { stage: "reading", progress: 0.05 });
        const pages = await extractPdfPages(file, (frac) =>
          setUpload(key, { stage: "reading", progress: 0.05 + frac * 0.35 }),
        );
        if (pages.length === 0) {
          throw new Error("No readable text found in this PDF.");
        }

        setUpload(key, { stage: "chunking", progress: 0.42 });
        const chunks = chunkPages(hash, pages);
        if (chunks.length === 0) throw new Error("Could not extract usable text chunks.");

        setUpload(key, { stage: "embedding", progress: 0.5 });
        const embeddings = await embedTexts(
          chunks.map((c) => c.text),
          (done, total) =>
            setUpload(key, {
              stage: "embedding",
              progress: 0.5 + (done / total) * 0.45,
              message: `${done}/${total} chunks embedded`,
            }),
        );

        const indexed: IndexedChunk[] = chunks.map((c, i) => ({
          ...c,
          embedding: Array.from(embeddings[i]),
        }));

        const record: DocumentRecord = {
          id: hash,
          name: file.name,
          pages: pages.length,
          chunkCount: indexed.length,
          createdAt: Date.now(),
          sizeBytes: file.size,
        };

        setUpload(key, { stage: "saving", progress: 0.97 });
        await saveDocument(record, indexed);
        setUpload(key, { stage: "done", progress: 1 });
        setTimeout(() => removeUpload(key), 1200);
        await refresh();
        return record;
      } catch (err) {
        setUpload(key, {
          stage: "error",
          progress: 1,
          message: (err as Error).message,
        });
        setTimeout(() => removeUpload(key), 4500);
        throw err;
      }
    },
    [refresh],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteDocument(id);
      await refresh();
    },
    [refresh],
  );

  // Reference minChars/topK to keep the config in the loaded module graph.
  void appConfig;

  return { documents, uploads, loading, upload, remove, refresh };
}