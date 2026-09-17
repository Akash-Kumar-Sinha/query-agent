"use client";

import { Table } from "lucide-react";
import { cn } from "@/lib/utils";

export interface QueryExecutionMetrics {
  elapsedMs: number;
  timestamp: string;
  rowsEvaluated?: number;
  bytesProcessed?: number;
}

export interface QueryExecutionResultData {
  success: boolean;
  data?: Record<string, unknown>[];
  rows?: number;
  metrics?: QueryExecutionMetrics;
  error?: string;
}

export interface QueryResultTableProps {
  result: QueryExecutionResultData;
  className?: string;
}

export const QueryResultTable = ({
  result,
  className,
}: QueryResultTableProps) => {
  const columns =
    result.data && result.data.length > 0 ? Object.keys(result.data[0]) : [];

  return (
    <div
      className={cn(
        "mt-1 flex flex-col gap-2 pt-2.5 border-t border-zinc-100",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Table className="w-3.5 h-3.5 text-zinc-600" />
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-700">
            Execution Result
          </span>
        </div>
        {result.success && result.metrics && (
          <span className="text-[10px] text-zinc-400 font-mono">
            {result.rows ?? result.data?.length ?? 0} rows •{" "}
            {result.metrics.elapsedMs}ms
          </span>
        )}
      </div>

      {result.success ? (
        result.data && result.data.length > 0 ? (
          <div className="w-full overflow-x-auto max-h-64 overflow-y-auto rounded-lg border border-zinc-200 custom-scroll bg-white">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead className="bg-zinc-100 sticky top-0 border-b border-zinc-200 z-10">
                <tr>
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="px-3 py-2 text-[11px] font-semibold text-zinc-700 tracking-wider whitespace-nowrap"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {result.data.map((row, rowIdx) => (
                  <tr
                    key={rowIdx}
                    className={
                      rowIdx % 2 === 0
                        ? "bg-white hover:bg-zinc-50/80"
                        : "bg-zinc-50/50 hover:bg-zinc-50"
                    }
                  >
                    {columns.map((col) => (
                      <td
                        key={col}
                        className="px-3 py-1.5 text-zinc-800 whitespace-nowrap"
                      >
                        {row[col] !== null && row[col] !== undefined
                          ? String(row[col])
                          : "NULL"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-3 text-center text-xs font-mono text-zinc-500 bg-zinc-50 rounded-lg border border-zinc-200">
            Query executed successfully. 0 rows returned.
          </div>
        )
      ) : (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-mono whitespace-pre-wrap break-words">
          <strong>Query Execution Error:</strong> {result.error}
        </div>
      )}
    </div>
  );
};
