import {
  toolRegistry,
  Tools,
  generateConversationStream,
  QueryCategory,
  AnalyticalValidationResult,
  PromptExpansionResult,
  QueryGenerationResult,
} from "@/lib/agent";

import { streamManager, StreamStatus, StreamStage } from "@/utils/stream";
import { NextRequest } from "next/server";

const validateAndStream = async function* (prompt: string) {
  yield streamManager.createEvent(
    StreamStage.STARTED,
    StreamStatus.SUCCESS,
    "Prompt validation pipeline initialized.",
  );

  yield streamManager.createEvent(
    StreamStage.DB_COMMAND_CHECK,
    StreamStatus.RUNNING,
    "Checking for blocked SQL commands...",
  );

  const dbResult = await toolRegistry.executeTool(Tools.DB_COMMAND_CHECK, {
    input: prompt,
  });

  if (!dbResult.success) {
    yield streamManager.createEvent(
      StreamStage.DB_COMMAND_CHECK,
      StreamStatus.FAILED,
      dbResult.error || "Blocked database command detected.",
      { error: dbResult.error },
    );

    let accumulatedText = "";
    yield streamManager.createEvent(
      StreamStage.CASUAL_TALK,
      StreamStatus.RUNNING,
      "Explaining...",
    );
    try {
      const stream = generateConversationStream(prompt, {
        isRejection: true,
        reason: dbResult.error || "Blocked destructive SQL command detected.",
      });
      for await (const token of stream) {
        accumulatedText += token;
        yield streamManager.createEvent(
          StreamStage.CASUAL_TALK,
          StreamStatus.RUNNING,
          accumulatedText,
        );
      }
    } catch (err) {
      console.warn("[API /api/query] Rejection explanation stream error:", err);
    }
    const finalReply = accumulatedText.trim();
    if (finalReply) {
      yield streamManager.createEvent(
        StreamStage.CASUAL_TALK,
        StreamStatus.SUCCESS,
        finalReply,
        { data: { response: finalReply } },
      );
    }
    return;
  }

  yield streamManager.createEvent(
    StreamStage.DB_COMMAND_CHECK,
    StreamStatus.SUCCESS,
    "Database safety check passed: No destructive commands found.",
    { data: true },
  );

  yield streamManager.createEvent(
    StreamStage.ANALYTICAL_CLASSIFICATION,
    StreamStatus.RUNNING,
    "Classifying query intent (READ_ONLY vs WRITE/DDL/PERMISSION/CASUAL_TALK/AMBIGUOUS)...",
  );

  const analyticalResult = await toolRegistry.executeTool(
    Tools.ANALYTICAL_VALIDATION,
    { input: prompt },
  );

  if (!analyticalResult.success) {
    yield streamManager.createEvent(
      StreamStage.ANALYTICAL_CLASSIFICATION,
      StreamStatus.FAILED,
      analyticalResult.error || "Intent classification failed.",
      { error: analyticalResult.error },
    );
    return;
  }

  const data = analyticalResult.data as AnalyticalValidationResult;

  if (data && data.category === QueryCategory.CASUAL_TALK) {
    yield streamManager.createEvent(
      StreamStage.ANALYTICAL_CLASSIFICATION,
      StreamStatus.SUCCESS,
      "Intent identified: Casual conversation / greeting.",
      { data },
    );

    let accumulatedText = "";
    yield streamManager.createEvent(
      StreamStage.CASUAL_TALK,
      StreamStatus.RUNNING,
      "Thinking...",
    );

    try {
      const stream = generateConversationStream(prompt, { isRejection: false });
      for await (const token of stream) {
        accumulatedText += token;
        yield streamManager.createEvent(
          StreamStage.CASUAL_TALK,
          StreamStatus.RUNNING,
          accumulatedText,
        );
      }
    } catch (err) {
      console.warn("[API /api/query] Talk stream error:", err);
    }

    const finalReply =
      accumulatedText.trim() ||
      "Hello! How can I assist you with your database queries today?";
    yield streamManager.createEvent(
      StreamStage.CASUAL_TALK,
      StreamStatus.SUCCESS,
      finalReply,
      { data: { response: finalReply } },
    );

    yield streamManager.createEvent(
      StreamStage.COMPLETED,
      StreamStatus.SUCCESS,
      "Response complete.",
      { data: { isCasual: true, response: finalReply } },
    );
    return;
  }

  if (data && !data.isAnalytical) {
    const errorMsg = `Query rejected [${data.category}]: "${prompt}" is not a valid analytical read request.`;
    yield streamManager.createEvent(
      StreamStage.ANALYTICAL_CLASSIFICATION,
      StreamStatus.FAILED,
      errorMsg,
      { data, error: errorMsg },
    );

    let accumulatedText = "";
    yield streamManager.createEvent(
      StreamStage.CASUAL_TALK,
      StreamStatus.RUNNING,
      "Explaining...",
    );
    try {
      const stream = generateConversationStream(prompt, {
        isRejection: true,
        reason: `${data.category}: ${errorMsg}`,
      });
      for await (const token of stream) {
        accumulatedText += token;
        yield streamManager.createEvent(
          StreamStage.CASUAL_TALK,
          StreamStatus.RUNNING,
          accumulatedText,
        );
      }
    } catch (err) {
      console.warn("[API /api/query] Rejection explanation stream error:", err);
    }
    const finalReply = accumulatedText.trim();
    if (finalReply) {
      yield streamManager.createEvent(
        StreamStage.CASUAL_TALK,
        StreamStatus.SUCCESS,
        finalReply,
        { data: { response: finalReply } },
      );
    }
    return;
  }

  yield streamManager.createEvent(
    StreamStage.ANALYTICAL_CLASSIFICATION,
    StreamStatus.SUCCESS,
    `Analytical query verified: [${data.category}].`,
    { data },
  );

  yield streamManager.createEvent(
    StreamStage.PROMPT_EXPANSION,
    StreamStatus.RUNNING,
    "Expanding query with detailed database specification...",
  );

  const expansionResult = await toolRegistry.executeTool(
    Tools.PROMPT_EXPANSION,
    { input: prompt },
  );

  if (!expansionResult.success) {
    yield streamManager.createEvent(
      StreamStage.PROMPT_EXPANSION,
      StreamStatus.FAILED,
      expansionResult.error || "Prompt expansion failed.",
      { error: expansionResult.error },
    );
    return;
  }

  const expansionData = expansionResult.data as PromptExpansionResult;

  yield streamManager.createEvent(
    StreamStage.PROMPT_EXPANSION,
    StreamStatus.SUCCESS,
    `Prompt expanded: ${expansionData.expandedPrompt}`,
    { data: expansionData },
  );

  yield streamManager.createEvent(
    StreamStage.QUERY_GENERATION,
    StreamStatus.RUNNING,
    "Generating ClickHouse SQL query...",
  );

  const queryGenResult = await toolRegistry.executeTool(
    Tools.QUERY_GENERATION,
    { input: expansionData.expandedPrompt || prompt },
  );

  if (!queryGenResult.success) {
    yield streamManager.createEvent(
      StreamStage.QUERY_GENERATION,
      StreamStatus.FAILED,
      queryGenResult.error || "ClickHouse SQL query generation failed.",
      { error: queryGenResult.error },
    );
    return;
  }

  const queryData = queryGenResult.data as QueryGenerationResult;

  yield streamManager.createEvent(
    StreamStage.QUERY_GENERATION,
    StreamStatus.SUCCESS,
    `ClickHouse SQL ready: ${queryData.explanation}`,
    { data: queryData },
  );

  yield streamManager.createEvent(
    StreamStage.COMPLETED,
    StreamStatus.SUCCESS,
    "Validation and query generation completed successfully.",
    {
      data: {
        valid: true,
        expansion: expansionData,
        classification: data,
        query: queryData,
      },
    },
  );
};

export const POST = async (request: NextRequest): Promise<Response> => {
  try {
    const body = await request.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error: "Prompt is required and must be a non-empty string.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    return streamManager.createSSEResponse(validateAndStream(prompt));
  } catch (error: unknown) {
    console.error("[API /api/query] Error processing request:", error);
    return new Response(
      JSON.stringify({ error: "Invalid JSON request payload." }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
};
