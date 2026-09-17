"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ExpansionViewerProps {
  text: string;
  className?: string;
}

export const ExpansionViewer = ({ text, className }: ExpansionViewerProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 font-mono">
          Generated Specification
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] font-mono text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer px-1.5 py-0.5 rounded hover:bg-zinc-200/60"
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
      </div>
      <div className="p-2.5 rounded-lg bg-white border border-zinc-200 text-zinc-800 text-xs font-mono leading-relaxed select-text whitespace-pre-wrap break-words shadow-xs">
        {text}
      </div>
    </div>
  );
};
