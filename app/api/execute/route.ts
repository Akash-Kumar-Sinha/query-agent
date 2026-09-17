import { executeClickHouseQuery } from "@/lib/clickhouse";
import { NextRequest } from "next/server";

export const POST = async (request: NextRequest): Promise<Response> => {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Query is required and must be a non-empty string.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const result = await executeClickHouseQuery(query.trim());

    if (!result.success) {
      return new Response(JSON.stringify(result), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("[API /api/execute] Unexpected execution error:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to execute database query.";

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
