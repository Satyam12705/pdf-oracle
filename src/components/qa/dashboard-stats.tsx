import { FileText, Layers, MessageSquare, ScrollText } from "lucide-react";

import { cn } from "@/lib/utils";

interface StatsProps {
  documents: number;
  pages: number;
  chunks: number;
  questions: number;
}

const items = (s: StatsProps) => [
  { label: "Documents", value: s.documents, icon: FileText },
  { label: "Pages", value: s.pages, icon: ScrollText },
  { label: "Chunks", value: s.chunks, icon: Layers },
  { label: "Questions", value: s.questions, icon: MessageSquare },
];

export function DashboardStats(props: StatsProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items(props).map(({ label, value, icon: Icon }, i) => (
        <div
          key={label}
          className={cn(
            "relative overflow-hidden rounded-xl border border-border/60 bg-card/60 p-3 shadow-soft backdrop-blur-sm",
          )}
          style={{ animation: `fadeIn 0.4s ease ${i * 60}ms both` }}
        >
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <Icon className="h-3.5 w-3.5 text-primary" />
          </div>
          <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            {value.toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
}