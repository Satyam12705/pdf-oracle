import { createFileRoute } from "@tanstack/react-router";
import { Moon, Sparkles, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";

import { ChatPanel } from "@/components/qa/chat-panel";
import { DashboardStats } from "@/components/qa/dashboard-stats";
import { DocumentList } from "@/components/qa/document-list";
import { UploadZone } from "@/components/qa/upload-zone";
import { Button } from "@/components/ui/button";
import { appConfig } from "@/config/app-config";
import { useDocuments } from "@/hooks/use-documents";
import { useTheme } from "@/hooks/use-theme";
import { warmupEmbeddings } from "@/lib/rag/embeddings";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { documents, uploads, upload, remove } = useDocuments();
  const { theme, toggle } = useTheme();
  const [questionsAsked, setQuestionsAsked] = useState(0);

  useEffect(() => {
    warmupEmbeddings();
  }, []);

  const totalPages = documents.reduce((n, d) => n + d.pages, 0);
  const totalChunks = documents.reduce((n, d) => n + d.chunkCount, 0);

  const handleFiles = async (files: File[]) => {
    for (const f of files) {
      try {
        await upload(f);
      } catch {
        /* handled inside hook via toast/upload state */
      }
    }
  };

  return (
    <div className="flex h-screen min-h-screen w-full overflow-hidden bg-background text-foreground">
      <Toaster richColors theme={theme} position="top-right" />

      {/* Sidebar */}
      <aside className="hidden w-80 shrink-0 flex-col border-r border-sidebar-border/60 bg-sidebar text-sidebar-foreground md:flex">
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-elegant">
              <Sparkles className="h-4.5 w-4.5" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">
                {appConfig.app.name}
              </p>
              <p className="text-[10px] text-muted-foreground">
                RAG · OpenRouter
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggle}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>

        <div className="space-y-4 px-4">
          <UploadZone onFiles={handleFiles} uploads={uploads} />
        </div>

        <div className="mt-6 flex-1 overflow-y-auto px-4 pb-6">
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Library ({documents.length})
          </p>
          <DocumentList documents={documents} onDelete={(id) => void remove(id)} />
        </div>

        <div className="border-t border-sidebar-border/60 p-4 text-[10px] text-muted-foreground">
          Embeddings run locally with MiniLM · Model:{" "}
          <span className="font-mono text-foreground/80">
            {appConfig.openrouter.model}
          </span>
        </div>
      </aside>

      {/* Main */}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border/60 bg-background/70 px-4 py-3 backdrop-blur-md md:px-8">
          <div>
            <h1 className="text-base font-semibold tracking-tight">
              {appConfig.app.name}
            </h1>
            <p className="text-xs text-muted-foreground">{appConfig.app.tagline}</p>
          </div>
          <div className="md:hidden">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggle}>
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>
        </header>

        <div className="border-b border-border/60 bg-gradient-surface px-4 py-4 md:px-8">
          <DashboardStats
            documents={documents.length}
            pages={totalPages}
            chunks={totalChunks}
            questions={questionsAsked}
          />
        </div>

        {/* Mobile upload */}
        <div className="border-b border-border/60 p-4 md:hidden">
          <UploadZone onFiles={handleFiles} uploads={uploads} />
          {documents.length > 0 && (
            <div className="mt-3">
              <DocumentList documents={documents} onDelete={(id) => void remove(id)} />
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1">
          <ChatPanel
            hasDocuments={documents.length > 0}
            onQuestionAsked={() => setQuestionsAsked((n) => n + 1)}
          />
        </div>
      </main>
    </div>
  );
}
