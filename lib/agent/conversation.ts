import { Tool, Tools } from "./tools";
import {
  pipeline,
  TextStreamer,
  type TextGenerationPipeline,
} from "@huggingface/transformers";
import { TALK_MODEL } from "@/lib/constant";

export interface ConversationArgs {
  input: string;
  isRejection?: boolean;
  reason?: string;
}

export interface ConversationResult {
  response: string;
  model: string;
}

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

export type TextGenerator = TextGenerationPipeline;

let generatorPromise: Promise<TextGenerationPipeline> | null = null;

const getGenerator = async (): Promise<TextGenerationPipeline> => {
  if (!generatorPromise) {
    generatorPromise = pipeline("text-generation", TALK_MODEL, {
      dtype: "q4",
    } as Record<string, unknown>) as Promise<TextGenerationPipeline>;
  }
  return generatorPromise;
};

export const getFallbackGreeting = (
  input: string,
  isRejection?: boolean,
  reason?: string,
): string => {
  if (isRejection) {
    if (
      reason?.includes("WRITE") ||
      reason?.includes("DELETE") ||
      reason?.includes("UPDATE")
    ) {
      return "This system connects to a ClickHouse OLAP (analytical) database and operates strictly in read-only mode. Row-level mutations and OLTP transactions are not supported, but I can help you compute high-speed aggregations, sums, and metric distributions!";
    }
    if (
      reason?.includes("DDL") ||
      reason?.includes("DROP") ||
      reason?.includes("CREATE")
    ) {
      return "Database schema and structural modifications (like creating or dropping tables) are disabled. You can ask me to run analytical aggregations or slice-and-dice data on existing tables like `uk_price_paid` and `trips`!";
    }
    if (reason?.includes("PERMISSION") || reason?.includes("GRANT")) {
      return "User access controls and database administration commands are restricted. Let me know what data metrics or analytical summaries you want to compute!";
    }
    return "This request is not a valid analytical read query. As an OLAP assistant, I specialize in aggregations, percentiles, time-series breakdowns, and summaries on your datasets.";
  }

  return "Hello! How can I assist you with your ClickHouse OLAP queries and analytics today?";
};

export const generateConversationStream = async function* (
  input: string,
  options?: { isRejection?: boolean; reason?: string },
): AsyncGenerator<string, string, void> {
  const queue: string[] = [];
  let resolveNext: (() => void) | null = null;
  let isDone = false;

  const pushToken = (token: string) => {
    queue.push(token);
    if (resolveNext) {
      resolveNext();
      resolveNext = null;
    }
  };

  const finish = () => {
    isDone = true;
    if (resolveNext) {
      resolveNext();
      resolveNext = null;
    }
  };

  (async () => {
    try {
      const generator = await getGenerator();
      const tokenizer = generator.tokenizer;

      const streamer = new TextStreamer(tokenizer, {
        skip_prompt: true,
        callback_function: (token: string) => {
          if (token) {
            pushToken(token);
          }
        },
      });

      const systemPrompt = options?.isRejection
        ? `You are an AI assistant for a ClickHouse OLAP (Online Analytical Processing) database. The user query was rejected because: "${options.reason || "it is not a valid analytical read query"}". In 1-2 complete sentences, explain that this is a read-only OLAP system and suggest valid analytical questions (aggregations, sums, trends, percentiles) they can ask.`
        : `You are an AI assistant for a ClickHouse OLAP (Online Analytical Processing) columnar database. You specialize in analytical queries, aggregations, metrics, and trends over large datasets (uk_price_paid and trips). Respond directly, concisely, and conversationally in 1-2 complete sentences.`;

      const messages = [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: input.trim(),
        },
      ];

      await generator(messages, {
        max_new_tokens: 512,
        temperature: 0.6,
        top_p: 0.9,
        do_sample: true,
        repetition_penalty: 1.2,
        streamer,
      });
    } catch (err) {
      console.warn("[Conversation Streaming fallback]:", err);
      const fallback = getFallbackGreeting(
        input,
        options?.isRejection,
        options?.reason,
      );
      const words = fallback.split(" ");
      for (const word of words) {
        pushToken(word + " ");
        await new Promise((r) => setTimeout(r, 20));
      }
    } finally {
      finish();
    }
  })();

  let fullReply = "";
  while (!isDone || queue.length > 0) {
    if (queue.length === 0) {
      await new Promise<void>((resolve) => {
        resolveNext = resolve;
      });
    }
    while (queue.length > 0) {
      const token = queue.shift()!;
      fullReply += token;
      yield token;
    }
  }

  return (
    fullReply.trim() ||
    getFallbackGreeting(input, options?.isRejection, options?.reason)
  );
};

export const conversationTool = new Tool<ConversationArgs, ConversationResult>({
  name: Tools.CONVERSATION,
  description:
    "Generates friendly conversational responses, chit-chat, and refusal explanations for a ClickHouse OLAP analytical assistant.",
  parameters: {
    type: "object",
    properties: {
      input: {
        type: "string",
        description: "The user conversational input or query context.",
      },
      isRejection: {
        type: "boolean",
        description: "Whether this is an explanation of a rejected query.",
      },
      reason: {
        type: "string",
        description: "The rejection reason if applicable.",
      },
    },
    required: ["input"],
  },
  execute: async ({ input, isRejection, reason }: ConversationArgs) => {
    try {
      let accumulated = "";
      const stream = generateConversationStream(input, { isRejection, reason });
      for await (const token of stream) {
        accumulated += token;
      }

      return {
        success: true,
        data: {
          response:
            accumulated.trim() ||
            getFallbackGreeting(input, isRejection, reason),
          model: TALK_MODEL,
        },
      };
    } catch (error: unknown) {
      return {
        success: true,
        data: {
          response: getFallbackGreeting(input, isRejection, reason),
          model: "fallback",
        },
      };
    }
  },
});
