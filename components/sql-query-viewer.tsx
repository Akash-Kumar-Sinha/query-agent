"use client";

import { useState } from "react";
import {
  Database,
  Copy,
  Check,
  Play,
  Pencil,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  QueryResultTable,
  QueryExecutionResultData,
} from "@/components/query-result-table";

export interface SqlQueryViewerProps {
  sql: string;
  explanation?: string;
  dialect?: string;
  className?: string;
}

export const SqlQueryViewer = ({
  sql,
  explanation,
  className,
}: SqlQueryViewerProps) => {
  const [editableSql, setEditableSql] = useState(sql);
  const [isEditing, setIsEditing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] =
    useState<QueryExecutionResultData | null>(null);

  const isModified = editableSql.trim() !== sql.trim();

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(editableSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditableSql(sql);
  };

  const handleExecute = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isExecuting || !editableSql.trim()) return;

    setIsExecuting(true);
    setExecutionResult(null);

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: editableSql }),
      });

      const json = await response.json();
      setExecutionResult(json);
    } catch (err) {
      console.error("[SqlQueryViewer] Execution error:", err);
      setExecutionResult({
        success: false,
        error:
          err instanceof Error
            ? err.message
            : "Failed to connect to database execution API.",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 p-3.5 rounded-xl border border-zinc-200/90 bg-white/95 transition-colors shadow-xs",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Database className="w-3.5 h-3.5 text-zinc-800" />
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-800">
            SQL Query
          </span>
          {isModified && (
            <span className="text-[9px] font-mono px-1.5 py-0.2 bg-amber-100 text-amber-800 border border-amber-200 rounded">
              Edited
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing((prev) => !prev);
            }}
            className={cn(
              "flex items-center gap-1 text-[11px] font-mono transition-colors cursor-pointer px-2 py-1 rounded",
              isEditing
                ? "bg-zinc-900 text-white hover:bg-zinc-800"
                : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100",
            )}
            title={isEditing ? "Close editor" : "Edit query"}
          >
            {isEditing ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Done</span>
              </>
            ) : (
              <>
                <Pencil className="w-3 h-3" />
                <span>Edit</span>
              </>
            )}
          </button>

          {isModified && (
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1 text-[11px] font-mono text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer px-1.5 py-1 rounded hover:bg-zinc-100"
              title="Reset to original query"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] font-mono text-zinc-500 hover:text-zinc-800 transition-colors cursor-pointer px-2 py-1 rounded hover:bg-zinc-100"
            title="Copy SQL"
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

          <button
            type="button"
            onClick={handleExecute}
            disabled={isExecuting || !editableSql.trim()}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-[11px] font-mono font-medium transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isExecuting ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>Executing...</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span>Approve & Run</span>
              </>
            )}
          </button>
        </div>
      </div>

      {isEditing ? (
        <div className="flex flex-col gap-1.5">
          <textarea
            value={editableSql}
            onChange={(e) => setEditableSql(e.target.value)}
            rows={Math.max(4, editableSql.split("\n").length + 1)}
            className="w-full p-3 rounded-lg bg-zinc-950 text-emerald-400 text-xs font-mono leading-relaxed border border-zinc-700 outline-none focus:border-zinc-400 shadow-inner resize-y custom-scroll"
            placeholder="Enter SQL query..."
            spellCheck={false}
          />
          <span className="text-[10px] font-mono text-zinc-400">
            Tip: You can modify SQL statements, WHERE clauses, or LIMIT before
            approving.
          </span>
        </div>
      ) : (
        <div className="p-3 rounded-lg bg-zinc-950 text-emerald-400 text-xs font-mono leading-relaxed select-text whitespace-pre-wrap break-words border border-zinc-800 shadow-inner">
          {editableSql}
        </div>
      )}

      {explanation && (
        <span className="text-[11px] text-zinc-500 font-mono italic px-0.5">
          {explanation}
        </span>
      )}

      {executionResult && <QueryResultTable result={executionResult} />}
    </div>
  );
};
