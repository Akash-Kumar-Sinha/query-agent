import { Tool, Tools } from "../tools";
import { PromptValidationArgs } from "./types";
import { BLOCKED_DB_COMMANDS } from "@/lib/constant";

const validateInputWithDbCommand = new Tool<PromptValidationArgs, boolean>({
  name: Tools.DB_COMMAND_CHECK,
  description:
    "Validates the input string and returns true if valid, false otherwise.",
  parameters: {
    type: "object",
    properties: {
      input: {
        type: "string",
        description: "The input string to validate.",
      },
    },
    required: ["input"],
  },
  execute: async ({ input }: PromptValidationArgs) => {
    const pattern = new RegExp(`\\b(${BLOCKED_DB_COMMANDS.join("|")})\\b`, "i");

    if (pattern.test(input)) {
      return {
        success: false,
        error: `Input contains blocked commands: ${BLOCKED_DB_COMMANDS.join(", ")}`,
      };
    }
    return {
      success: true,
      data: true,
    };
  },
});

export { validateInputWithDbCommand };

