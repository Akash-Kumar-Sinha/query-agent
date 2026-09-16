import { Tool } from "./base";
import {
  ToolExecutionContext,
  ToolResult,
  LLMFunctionDeclaration,
  LLMToolDeclaration,
} from "./types";

export class ToolRegistry {
  private tools = new Map<string, Tool<never, unknown>>();

  register<TArgs = Record<string, unknown>, TResult = unknown>(
    tool: Tool<TArgs, TResult>,
  ): this {
    this.tools.set(tool.name, tool as unknown as Tool<never, unknown>);
    return this;
  }

  registerMany(tools: Tool<Record<string, unknown>, unknown>[]): this {
    for (const tool of tools) {
      this.register(tool);
    }
    return this;
  }

  get<TArgs = Record<string, unknown>, TResult = unknown>(
    name: string,
  ): Tool<TArgs, TResult> | undefined {
    return this.tools.get(name) as unknown as Tool<TArgs, TResult> | undefined;
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  getAll(): Tool<Record<string, unknown>, unknown>[] {
    return Array.from(this.tools.values()) as unknown as Tool<
      Record<string, unknown>,
      unknown
    >[];
  }

  getFunctionDeclarations(): LLMFunctionDeclaration[] {
    return this.getAll().map((tool) => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.parameters,
    }));
  }

  getToolDeclarations(): LLMToolDeclaration[] {
    return this.getAll().map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }

  async executeTool<TArgs = Record<string, unknown>, TResult = unknown>(
    name: string,
    args: TArgs,
    context?: ToolExecutionContext,
  ): Promise<ToolResult<TResult>> {
    const tool = this.get<TArgs, TResult>(name);
    if (!tool) {
      return {
        success: false,
        error: `Tool "${name}" is not registered in the tool registry. Available tools: [${Array.from(this.tools.keys()).join(", ")}]`,
      };
    }

    return await tool.run(args, context);
  }

  unregister(name: string): boolean {
    return this.tools.delete(name);
  }

  clear(): void {
    this.tools.clear();
  }
}

export const toolRegistry = new ToolRegistry();
