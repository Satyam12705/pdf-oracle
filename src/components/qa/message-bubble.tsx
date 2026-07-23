import { motion } from "framer-motion";
import { ChevronDown, Sparkles, User } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

import { cn } from "@/lib/utils";
import type { ChatMessage } from "./types";

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const [open, setOpen] = useState(false);
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
    >
      {!isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground shadow-elegant">
          <Sparkles className="h-4 w-4" />
        </div>
      )}

      <div className={cn("max-w-[85%] space-y-1.5", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-soft",
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-card text-card-foreground border border-border/60",
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-ul:my-2 prose-li:my-0.5">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="rounded-xl border border-border/60 bg-muted/30 text-xs">
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2 font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <span>
                {message.sources.length} source{message.sources.length === 1 ? "" : "s"} retrieved
              </span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 transition-transform",
                  open && "rotate-180",
                )}
              />
            </button>
            {open && (
              <div className="space-y-2 border-t border-border/60 p-3">
                {message.sources.map((s, i) => (
                  <div key={i} className="rounded-lg bg-background/60 p-2.5">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="truncate text-[11px] font-semibold text-foreground">
                        [Source {i + 1}] {s.docName} · page {s.page}
                      </span>
                      <span className="shrink-0 rounded-full bg-primary/15 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        {(s.score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="line-clamp-4 text-[11px] leading-relaxed text-muted-foreground">
                      {s.text}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <p
          className={cn(
            "px-1 text-[10px] text-muted-foreground",
            isUser && "text-right",
          )}
        >
          {formatTime(message.createdAt)}
        </p>
      </div>

      {isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/70 bg-muted text-muted-foreground">
          <User className="h-4 w-4" />
        </div>
      )}
    </motion.div>
  );
}