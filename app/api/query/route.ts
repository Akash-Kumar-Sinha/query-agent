import { toolRegistry } from "@/lib/agent";
import { validateInputWithDbCommand } from "@/lib/agent/validateInputWithDbCommand";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is required and must be a non-empty string." },
        { status: 400 },
      );
    }

    console.log("[API /api/query] Received prompt:", prompt);

    const result = await toolRegistry.executeTool(
      validateInputWithDbCommand.name,
      {
        input: prompt,
      },
    );

    console.log("[API /api/query] Tool execution result:", result);

    return NextResponse.json({
      success: true,
      prompt,
      message: "Prompt received successfully.",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[API /api/query] Error processing request:", error);
    return NextResponse.json(
      { error: "Failed to process prompt." },
      { status: 500 },
    );
  }
}
