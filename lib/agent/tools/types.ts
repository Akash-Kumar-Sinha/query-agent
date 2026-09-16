export enum Tools {
  DB_COMMAND_CHECK = "db_command_check",
  ANALYTICAL_VALIDATION = "analytical_validation",
  PROMPT_EXPANSION = "prompt_expansion",
  CONVERSATION = "conversation",
  QUERY_GENERATION = "generate_query",
}


export type JSONSchemaType =
  | "string"
  | "number"
  | "integer"
  | "boolean"
  | "object"
  | "array"
  | "null";

export interface ToolDefinition<
  TArgs = Record<string, unknown>,
  TResult = unknown,
> {
  name: string;
  description: string;
  parameters: ToolParametersSchema;
  execute: (
    args: TArgs,
    context?: ToolExecutionContext,
  ) => Promise<ToolResult<TResult>>;
}

export interface ToolParametersSchema {
  type: "object";
  properties: Record<string, JSONSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface ToolExecutionContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  signal?: AbortSignal;
  [key: string]: unknown;
}

export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    executionTimeMs?: number;
    timestamp?: string;
    [key: string]: unknown;
  };
}

export interface JSONSchemaProperty {
  type: JSONSchemaType;
  description?: string;
  enum?: string[] | number[];
  items?: JSONSchemaProperty;
  properties?: Record<string, JSONSchemaProperty>;
  required?: string[];
  default?: unknown;
}

export interface LLMFunctionDeclaration {
  name: string;
  description: string;
  parameters: ToolParametersSchema;
}

export interface LLMToolDeclaration {
  type: "function";
  function: LLMFunctionDeclaration;
}

