"use client";

import { useState } from "react";
import { StreamEvent, StreamStatus } from "@/utils/stream";
import { StageIcon } from "@/components/stage-icon";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AssistantResponseCardProps {
  event: StreamEvent;
  className?: string;
}

export const AssistantResponseCard = ({
  event,
  className,
}: AssistantResponseCardProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!event.message) return;
    navigator.clipboard.writeText(event.message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 p-3.5 rounded-xl border border-zinc-200/90 bg-white/95 transition-colors shadow-xs",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
        <div className="flex items-center gap-2">
          <span className="shrink-0">
            <StageIcon event={event} />
          </span>
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-600">
            Assistant Response
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            disabled={event.status === StreamStatus.RUNNING}
            className="flex items-center gap-1 text-[11px] font-mono text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer px-1.5 py-0.5 rounded hover:bg-zinc-200/60 disabled:opacity-40 disabled:cursor-not-allowed"
            title="Copy response"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-600">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
          <span className="text-[10px] text-zinc-400 font-mono">
            {new Date(event.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </div>
      </div>
      <div className="text-xs font-mono leading-relaxed text-zinc-800 select-text whitespace-pre-wrap break-words">
        {event.message}
        {event.status === StreamStatus.RUNNING && (
          <span className="inline-block w-1.5 h-3.5 bg-amber-500 ml-1 animate-pulse align-middle" />
        )}
      </div>
    </div>
  );
};
