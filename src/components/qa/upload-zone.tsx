import { motion } from "framer-motion";
import { CloudUpload, FileText, Loader2, X } from "lucide-react";
import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";

import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { UploadProgress } from "@/hooks/use-documents";

interface Props {
  onFiles: (files: File[]) => Promise<void> | void;
  uploads: Record<string, UploadProgress>;
}

const stageLabel: Record<UploadProgress["stage"], string> = {
  reading: "Reading PDF",
  chunking: "Chunking",
  embedding: "Embedding",
  saving: "Saving",
  done: "Done",
  error: "Error",
};

export function UploadZone({ onFiles, uploads }: Props) {
  const onDrop = useCallback(
    async (accepted: File[], rejected: unknown[]) => {
      if (rejected.length > 0) toast.error("Only PDF files are supported.");
      if (accepted.length === 0) return;
      await onFiles(accepted);
    },
    [onFiles],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: true,
  });

  const active = Object.entries(uploads);

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          "group relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-sidebar-border/70 bg-sidebar-accent/30 px-4 py-6 text-center transition-all hover:border-primary/60 hover:bg-sidebar-accent/60",
          isDragActive && "border-primary bg-primary/10",
        )}
      >
        <input {...getInputProps()} />
        <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-elegant">
          <CloudUpload className="h-5 w-5" />
        </div>
        <p className="text-sm font-medium text-sidebar-foreground">
          {isDragActive ? "Drop your PDFs here" : "Drop PDFs or click to upload"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Text-only extraction, processed locally.
        </p>
      </div>

      {active.length > 0 && (
        <div className="space-y-2">
          {active.map(([key, u]) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={cn(
                "rounded-xl border bg-sidebar-accent/50 p-3 text-xs",
                u.stage === "error"
                  ? "border-destructive/50 bg-destructive/10 text-destructive-foreground"
                  : "border-sidebar-border/60",
              )}
            >
              <div className="flex items-center gap-2">
                {u.stage === "error" ? (
                  <X className="h-3.5 w-3.5 text-destructive" />
                ) : u.stage === "done" ? (
                  <FileText className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                )}
                <span className="truncate font-medium text-sidebar-foreground">
                  {u.fileName}
                </span>
                <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">
                  {stageLabel[u.stage]}
                </span>
              </div>
              <Progress value={u.progress * 100} className="mt-2 h-1" />
              {u.message && (
                <p className="mt-1.5 text-[11px] text-muted-foreground">{u.message}</p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}