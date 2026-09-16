import { createClient, type ClickHouseClient } from "@clickhouse/client";
import { validateInputWithDbCommand } from "@/lib/agent/validation/validateInputWithDbCommand";

export interface QueryMetrics {
  action: "check" | "insert";
  elapsedMs: number;
  rowsEvaluated: number;
  bytesProcessed: number;
  speedRowsPerSec?: number;
  timestamp: string;
}

export class ClickHouse {
  private client: ClickHouseClient | null = null;

  private getClient(): ClickHouseClient {
    if (!this.client) {
      const url = process.env.CLICKHOUSE_URL || "http://localhost:8123";
      const username = process.env.CLICKHOUSE_USER || "default";
      const password = process.env.CLICKHOUSE_PASSWORD || "";
      const database = process.env.CLICKHOUSE_DATABASE || "default";

      this.client = createClient({
        url,
        username,
        password,
        database,
      });
    }
    return this.client;
  }


  public async executeQuery<T = unknown>(
    query: string,
  ): Promise<QueryExecutionResult<T>> {
    const safetyCheck = await validateInputWithDbCommand.run({ input: query });
    if (!safetyCheck.success) {
      return {
        success: false,
        query,
        error: safetyCheck.error || "Query failed database safety check.",
        metrics: {
          elapsedMs: 0,
          timestamp: new Date().toISOString(),
        },
      };
    }


    const startTime = performance.now();
    try {
      const client = this.getClient();
      const resultSet = await client.query({
        query,
        format: "JSONEachRow",
      });

      const data = await resultSet.json<T>();
      const elapsedMs = Math.round((performance.now() - startTime) * 100) / 100;
      const dataArray = Array.isArray(data) ? data : [data];

      return {
        success: true,
        data: dataArray,
        rows: dataArray.length,
        query,
        metrics: {
          elapsedMs,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error: unknown) {
      const elapsedMs = Math.round((performance.now() - startTime) * 100) / 100;
      const errorMessage =
        error instanceof Error ? error.message : "Failed to execute ClickHouse query";

      return {
        success: false,
        query,
        error: errorMessage,
        metrics: {
          elapsedMs,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }
}

export interface QueryExecutionResult<T = unknown> {
  success: boolean;
  data?: T[];
  rows?: number;
  query: string;
  metrics?: {
    elapsedMs: number;
    rowsEvaluated?: number;
    bytesProcessed?: number;
    timestamp: string;
  };
  error?: string;
}

export const clickhouseService = new ClickHouse();

export const executeClickHouseQuery = async <T = unknown>(query: string) => {
  return clickhouseService.executeQuery<T>(query);
};
