import * as pdfjsLib from "pdfjs-dist";
// Vite resolves this to a URL for the worker bundle.
import PdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = PdfWorker;

export interface PdfPage {
  page: number;
  text: string;
}

export async function extractPdfPages(
  file: File,
  onProgress?: (fraction: number) => void,
): Promise<PdfPage[]> {
  const buffer = await file.arrayBuffer();
  const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
  const pages: PdfPage[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items
      .map((it) => ("str" in it ? (it as { str: string }).str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
    if (text.length > 0) {
      pages.push({ page: i, text });
    }
    onProgress?.(i / doc.numPages);
  }
  return pages;
}