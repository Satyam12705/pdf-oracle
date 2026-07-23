import { motion, AnimatePresence } from "framer-motion";
import { FileText, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { DocumentRecord } from "@/lib/rag/vector-store";

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentList({
  documents,
  onDelete,
}: {
  documents: DocumentRecord[];
  onDelete: (id: string) => void;
}) {
  if (documents.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-sidebar-border/60 p-4 text-center text-xs text-muted-foreground">
        No documents yet. Upload a PDF to get started.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <AnimatePresence initial={false}>
        {documents.map((doc) => (
          <motion.div
            key={doc.id}
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="group flex items-start gap-2 rounded-xl border border-sidebar-border/60 bg-card/40 p-3 transition-colors hover:bg-sidebar-accent/60"
          >
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
              <FileText className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {doc.name}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {doc.pages} pages · {doc.chunkCount} chunks · {formatBytes(doc.sizeBytes)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              onClick={() => onDelete(doc.id)}
              aria-label={`Delete ${doc.name}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}