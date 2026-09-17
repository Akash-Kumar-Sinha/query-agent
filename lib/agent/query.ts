import { Tool, Tools } from "./tools";
import {
  CLICKHOUSE_SCHEMA_DEFINITION,
  OPENROUTER_API_URL,
} from "@/lib/constant";
import { validateInputWithDbCommand } from "./validation";

export interface QueryGenerationArgs {
  input: string;
  schemaContext?: string;
}

export interface QueryGenerationResult {
  sql: string;
  explanation: string;
  dialect: "clickhouse";
  model: string;
}

const normalizeClickHouseSql = (sql: string): string => {
  let normalized = sql;

  normalized = normalized.replace(
    /quantile\s*\(\s*([a-zA-Z0-9_]+)\s*,\s*([0-9.]+)\s*\)/gi,
    "quantile($2)($1)",
  );

  normalized = normalized.replace(
    /quantiles\s*\(\s*([a-zA-Z0-9_]+)\s*,\s*([0-9.,\s]+)\s*\)/gi,
    "quantiles($2)($1)",
  );

  return normalized;
};

const extractSqlQuery = (raw: string): string => {
  const codeBlockMatch = raw.match(/```(?:sql)?\s*([\s\S]*?)(?:```|$)/i);
  if (codeBlockMatch && codeBlockMatch[1] && codeBlockMatch[1].trim()) {
    let sql = codeBlockMatch[1].trim();
    sql = sql.replace(/```/g, "").trim();
    return normalizeClickHouseSql(sql);
  }

  const selectMatch = raw.match(
    /\b(SELECT|WITH|SHOW|DESCRIBE|EXPLAIN)\b[\s\S]+/i,
  );
  if (selectMatch) {
    let query = selectMatch[0];
    const semiIndex = query.indexOf(";");
    if (semiIndex !== -1) {
      query = query.slice(0, semiIndex + 1);
    }
    return normalizeClickHouseSql(query.trim());
  }

  return normalizeClickHouseSql(raw.trim());
};

const extractExplanation = (
  raw: string,
  defaultExplanation: string,
): string => {
  const parts = raw.split(/```/);
  if (parts.length >= 3 && parts[2].trim()) {
    const clean = parts[2].replace(/^[\s\n\r:.-]+/, "").trim();
    if (clean.length > 5) return clean;
  }
  return defaultExplanation;
};

const generateQueryViaOpenRouter = async (
  input: string,
  schema: string,
  apiKey: string,
): Promise<QueryGenerationResult | null> => {
  const model = process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet";

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: `You are an expert ClickHouse SQL generator.
Generate ONLY valid, complete, optimized, read-only ClickHouse SQL queries matching the actual database tables:
${schema}

ClickHouse-Specific Syntax Rules:
1. Parametric Aggregate Functions:
   - For Median: use \`median(column)\` or \`quantile(0.5)(column)\`.
   - For Quantiles: MUST use ClickHouse parametric syntax: \`quantile(level)(column)\` (e.g. \`quantile(0.5)(price)\` or \`quantile(0.95)(trip_distance)\`). NEVER write \`quantile(column, level)\`.
   - For Multiple Quantiles: \`quantiles(0.5, 0.95)(column)\`.
2. Date & Time Functions:
   - Use \`toDate('YYYY-MM-DD')\`, \`toYear(date)\`, \`toMonth(date)\`, \`toStartOfMonth(date)\`, \`toStartOfDay(pickup_datetime)\`, \`formatDateTime(toStartOfMonth(date), '%Y-%m')\`.
3. Standard Aggregations & Rounding:
   - Use \`count()\`, \`sum(price)\`, \`round(avg(price), 2)\`.
4. Output Format:
   - NEVER produce destructive queries (no INSERT, UPDATE, DELETE, DROP, ALTER).
   - Output the complete SQL query inside a markdown code block: \`\`\`sql ... \`\`\`.
   - Ensure all quotes and parentheses are properly closed.
   - Provide a concise 1-sentence analytical explanation after the code block.`,
          },
          {
            role: "user",
            content: input.trim(),
          },
        ],
        temperature: 0.1,
        max_tokens: 2500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[OpenRouter API Error] Status ${response.status}:`,
        errorText,
      );
      return null;
    }

    const json = await response.json();
    const rawContent: string = json.choices?.[0]?.message?.content || "";
    const extractedSql = extractSqlQuery(rawContent);
    const safety = await validateInputWithDbCommand.run({
      input: extractedSql,
    });

    if (safety.success && extractedSql) {
      const explanation = extractExplanation(
        rawContent,
        `ClickHouse SQL generated via OpenRouter (${model})`,
      );
      return {
        sql: extractedSql,
        explanation,
        dialect: "clickhouse",
        model: `openrouter/${model}`,
      };
    }

    return null;
  } catch (error) {
    console.error("[OpenRouter API] Request failed:", error);
    return null;
  }
};

export const generateClickHouseQuery = async (
  input: string,
  schemaContext?: string,
): Promise<QueryGenerationResult> => {
  const effectiveSchema = schemaContext || CLICKHOUSE_SCHEMA_DEFINITION;
  const openRouterApiKey =
    process.env.OPENROUTER_API_KEY || process.env.OPEN_ROUTER_API_KEY;

  if (!openRouterApiKey) {
    throw new Error(
      "OPENROUTER_API_KEY is not set in environment variables. Please configure OPENROUTER_API_KEY in .env.",
    );
  }

  const openRouterResult = await generateQueryViaOpenRouter(
    input,
    effectiveSchema,
    openRouterApiKey,
  );

  if (!openRouterResult) {
    throw new Error(
      "Failed to generate valid ClickHouse SQL query via OpenRouter API.",
    );
  }

  return openRouterResult;
};

export const queryGeneration = new Tool<
  QueryGenerationArgs,
  QueryGenerationResult
>({
  name: Tools.QUERY_GENERATION,
  description:
    "Generates read-only ClickHouse SQL queries from natural language specifications using OpenRouter.",
  parameters: {
    type: "object",
    properties: {
      input: {
        type: "string",
        description:
          "The natural language query or expanded prompt specification.",
      },
      schemaContext: {
        type: "string",
        description: "Optional database schema or table metadata context.",
      },
    },
    required: ["input"],
  },
  execute: async ({ input, schemaContext }: QueryGenerationArgs) => {
    try {
      const result = await generateClickHouseQuery(input, schemaContext);
      return {
        success: true,
        data: result,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to generate ClickHouse query.";
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});
