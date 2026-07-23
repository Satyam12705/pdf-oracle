import { motion } from "framer-motion";
import { Send, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { appConfig } from "@/config/app-config";
import { askQuestion } from "@/lib/ask.functions";
import { embedQuery } from "@/lib/rag/embeddings";
import { search } from "@/lib/rag/vector-store";

import { MessageBubble } from "./message-bubble";
import type { ChatMessage, SourceCitation } from "./types";

interface Props {
  hasDocuments: boolean;
  onQuestionAsked: () => void;
}

const suggested = [
  "Summarize the key findings.",
  "What are the main conclusions?",
  "List the most important terms defined.",
];

export function ChatPanel({ hasDocuments, onQuestionAsked }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, pending]);

  useEffect(() => {
    if (!pending) inputRef.current?.focus();
  }, [pending]);

  const ask = async (question: string) => {
    if (!question.trim() || pending) return;
    if (!hasDocuments) {
      toast.error("Upload a PDF first.");
      return;
    }
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: question.trim(),
      createdAt: Date.now(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setPending(true);

    try {
      const queryVec = await embedQuery(question);
      const results = await search(queryVec, appConfig.retrieval.topK);
      const relevant = results.filter((r) => r.score >= appConfig.retrieval.minScore);

      const sources: SourceCitation[] = relevant.map((r) => ({
        docName: r.docName,
        page: r.chunk.page,
        text: r.chunk.text,
        score: r.score,
      }));

      const history = messages.slice(-6).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const { answer } = await askQuestion({
        data: {
          question,
          contexts: sources.map((s) => ({
            docName: s.docName,
            page: s.page,
            text: s.text,
          })),
          history,
        },
      });

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: answer,
        createdAt: Date.now(),
        sources,
      };
      setMessages((m) => [...m, assistantMsg]);
      onQuestionAsked();
    } catch (err) {
      const message = (err as Error).message ?? "Something went wrong.";
      toast.error(message);
      setMessages((m) => [
        ...m,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `⚠️ ${message}`,
          createdAt: Date.now(),
        },
      ]);
    } finally {
      setPending(false);
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void ask(input);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto px-4 py-6 md:px-8">
        {messages.length === 0 ? (
          <div className="mx-auto flex h-full max-w-lg flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-elegant">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Ask your documents
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {hasDocuments
                ? "Answers are grounded strictly in the PDFs you've uploaded. Sources included."
                : "Upload a PDF from the sidebar to start asking questions."}
            </p>
            {hasDocuments && (
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {suggested.map((s) => (
                  <button
                    key={s}
                    onClick={() => void ask(s)}
                    className="rounded-full border border-border/70 bg-card/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} />)
        )}

        {pending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-elegant">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1 rounded-2xl border border-border/60 bg-card px-4 py-3 shadow-soft">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
              <span className="ml-2 text-xs text-muted-foreground">
                Searching and thinking…
              </span>
            </div>
          </motion.div>
        )}
      </div>

      <div className="border-t border-border/60 bg-background/80 p-4 backdrop-blur-md md:px-8">
        <div className="relative mx-auto max-w-3xl">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            disabled={pending}
            placeholder={
              hasDocuments ? "Ask a question about your documents…" : "Upload a PDF to begin…"
            }
            rows={1}
            className="min-h-[52px] resize-none rounded-2xl border-border/60 bg-card pr-14 text-sm shadow-soft focus-visible:ring-primary/40"
          />
          <Button
            size="icon"
            onClick={() => void ask(input)}
            disabled={pending || !input.trim() || !hasDocuments}
            className="absolute bottom-2 right-2 h-9 w-9 rounded-xl bg-gradient-primary text-primary-foreground shadow-elegant hover:opacity-90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-muted-foreground">
          Retrieval-augmented answers via OpenRouter · {appConfig.openrouter.model}
        </p>
      </div>
    </div>
  );
}