import {
  ToolDefinition,
  ToolExecutionContext,
  ToolResult,
  LLMFunctionDeclaration,
  LLMToolDeclaration,
} from "./types";

export class Tool<TArgs = Record<string, unknown>, TResult = unknown> {
  readonly name: string;
  readonly description: string;
  readonly parameters: ToolDefinition<TArgs, TResult>["parameters"];
  private readonly _execute: ToolDefinition<TArgs, TResult>["execute"];

  constructor(definition: ToolDefinition<TArgs, TResult>) {
    this.name = definition.name;
    this.description = definition.description;
    this.parameters = definition.parameters;
    this._execute = definition.execute;
  }

  async run(
    args: TArgs,
    context?: ToolExecutionContext,
  ): Promise<ToolResult<TResult>> {
    const start = performance.now();
    try {
      this.validateRequiredArgs(args);
      const result = await this._execute(args, context);
      const executionTimeMs = Number((performance.now() - start).toFixed(2));

      return {
        ...result,
        metadata: {
          executionTimeMs,
          timestamp: new Date().toISOString(),
          ...result.metadata,
        },
      };
    } catch (error: unknown) {
      const executionTimeMs = Number((performance.now() - start).toFixed(2));
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "An unexpected error occurred while executing the tool.";

      return {
        success: false,
        error: errorMessage,
        metadata: {
          executionTimeMs,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  private validateRequiredArgs(args: unknown) {
    if (!this.parameters.required || this.parameters.required.length === 0) {
      return;
    }

    const record =
      args !== null && typeof args === "object"
        ? (args as Record<string, unknown>)
        : undefined;

    const missing = this.parameters.required.filter(
      (key) => record === undefined || record[key] === undefined,
    );

    if (missing.length > 0) {
      throw new Error(
        `Tool "${this.name}" missing required arguments: ${missing.join(", ")}`,
      );
    }
  }

  toFunctionDeclaration(): LLMFunctionDeclaration {
    return {
      name: this.name,
      description: this.description,
      parameters: this.parameters,
    };
  }

  toToolDeclaration(): LLMToolDeclaration {
    return {
      type: "function",
      function: this.toFunctionDeclaration(),
    };
  }
}

export function defineTool<TArgs = Record<string, unknown>, TResult = unknown>(
  definition: ToolDefinition<TArgs, TResult>,
): Tool<TArgs, TResult> {
  return new Tool(definition);
}
