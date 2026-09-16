import { Tool } from "./tools";

const blockedCommands = [
  "UPDATE",
  "DELETE",
  "CREATE",
  "ALTER",
  "DROP",
  "TRUNCATE",
  "RENAME",
  "GRANT",
  "REVOKE",
  "OPTIMIZE",
  "KILL",
  "SYSTEM",
];

const VALIDATE_INPUT_WITH_DB_COMMAND_TOOL_NAME =
  "validate_input_with_db_command" as const;

interface ValidateInputArgs {
  input: string;
}

const validateInputWithDbCommand = new Tool<ValidateInputArgs, boolean>({
  name: VALIDATE_INPUT_WITH_DB_COMMAND_TOOL_NAME,
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
  execute: async ({ input }: ValidateInputArgs) => {
    const pattern = new RegExp(`\\b(${blockedCommands.join("|")})\\b`, "i");

    if (pattern.test(input)) {
      return {
        success: false,
        error: `Input contains blocked commands: ${blockedCommands.join(", ")}`,
      };
    }
    return {
      success: true,
      data: true,
    };
  },
});

export { validateInputWithDbCommand, VALIDATE_INPUT_WITH_DB_COMMAND_TOOL_NAME };