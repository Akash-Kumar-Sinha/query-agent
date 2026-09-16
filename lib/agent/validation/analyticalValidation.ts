import { Tool, Tools } from "../tools";
import { pipeline } from "@huggingface/transformers";
import { PromptValidationArgs } from "./types";

import { CLASSIFIER_MODEL } from "@/lib/constant";


export enum QueryCategory {
  READ_ONLY = "READ_ONLY",
  WRITE = "WRITE",
  DDL = "DDL",
  PERMISSION = "PERMISSION",
  AMBIGUOUS = "AMBIGUOUS",
  CASUAL_TALK = "CASUAL_TALK",
  UNKNOWN = "UNKNOWN",
}

export type QueryCategoryType = `${QueryCategory}` | QueryCategory;

export interface AnalyticalValidationResult {
  category: QueryCategory;
  topLabel: string;
  isAnalytical: boolean;
  rawResponse: string;
}

type TextGenerator = (
  text: string,
  options?: {
    max_new_tokens?: number;
    temperature?: number;
    do_sample?: boolean;
  },
) => Promise<Array<{ generated_text: string }>>;

let generatorPromise: Promise<TextGenerator> | null = null;

const getGenerator = async (): Promise<TextGenerator> => {
  if (!generatorPromise) {
    generatorPromise = pipeline(
      "text2text-generation",
      CLASSIFIER_MODEL,
    ) as unknown as Promise<TextGenerator>;
  }
  return generatorPromise;
};

const quickClassify = (input: string): QueryCategory | null => {
  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();

  // 1. DDL commands check
  if (
    /\b(drop|truncate|alter|create|rename)\s+(table|database|index|view|schema|column)\b/i.test(
      lower,
    ) ||
    /^(drop|truncate|alter|create)\s+/i.test(lower)
  ) {
    return QueryCategory.DDL;
  }

  // 2. DML write commands check
  if (
    /\b(delete\s+from|insert\s+into|update\s+\w+\s+set|remove\s+from|erase|purge)\b/i.test(
      lower,
    ) ||
    /^(delete|insert|update)\s+/i.test(lower)
  ) {
    return QueryCategory.WRITE;
  }

  // 3. Permissions / Access control check
  if (
    /\b(grant|revoke)\s+/i.test(lower) ||
    /\b(admin\s+access|root\s+access|sudo|grant\s+permission|roles?|access\s+control)\b/i.test(
      lower,
    )
  ) {
    return QueryCategory.PERMISSION;
  }

  // 4. Off-topic code snippet check
  const offTopicKeywords = [
    "backdrop-blur",
    "border-zinc",
    "shadow-",
    "rounded-",
    "flex-",
    "bg-",
    "text-",
    "px-",
    "py-",
    "<div>",
    "console.log",
    "import ",
    "export ",
    "const ",
  ];
  if (offTopicKeywords.some((kw) => lower.includes(kw))) {
    return QueryCategory.AMBIGUOUS;
  }

  // 5. Analytical query patterns
  const analyticalQueryPatterns = [
    /\b(give me|write|generate|show|provide|create)\s+(me\s+)?(the\s+|a\s+)?(query|sql|code|script)\b/i,
    /\bhow\s+(to|do\s+i|can\s+i|would\s+i)\s+(find|get|fetch|calculate|compute|query|see|filter|list|search|aggregate|extract)\b/i,
    /\b(how\s+many|how\s+much|what\s+is\s+the|what\s+are\s+the|which)\b.*\b(price|sales|trips|properties|records|listings|count|average|sum|total|fare|distance|vendor|duration)\b/i,
    /\b(show|display|get|list|fetch|find|calculate|compute|compare|summarize|describe|search|rank|filter|group|aggregate)\b/i,
    /\b(price|property|properties|house|houses|flat|flats|detached|semi-detached|terraced|town|postcode|county|district|uk_price_paid)\b/i,
    /\b(trip|trips|taxi|taxis|cab|cabs|fare|distance|passenger|passengers|tip|pickup|dropoff|vendor|cab_type|payment_type)\b/i,
    /\b(product|products|item|items|listing|listings|listed|record|records|data|dataset|table|row|rows|column|columns)\b/i,
    /^select\s+/i,
    /\b(group\s+by|order\s+by|having|where|limit\s+\d+|toyear|tomonth|todate)\b/i,
  ];

  if (analyticalQueryPatterns.some((pattern) => pattern.test(lower))) {
    return QueryCategory.READ_ONLY;
  }

  // 6. Greetings and casual small-talk
  const pureGreetings = [
    "hi",
    "hello",
    "hey",
    "how are you",
    "how are you doing",
    "what's up",
    "whats up",
    "good morning",
    "good evening",
    "good afternoon",
    "who are you",
    "what can you do",
    "what are you building",
    "what are you doing",
    "tell me about yourself",
    "help",
    "yo",
    "sup",
    "howdy",
    "thanks",
    "thank you",
    "bye",
    "goodbye",
  ];

  if (
    pureGreetings.includes(lower) ||
    /^(hi|hello|hey|greetings|howdy)\b/i.test(lower) ||
    /^(is it|what day|what time|who is|who are|tell me a joke|how are you|how is your day|can you chat|are you human)\b/i.test(
      lower,
    )
  ) {
    return QueryCategory.CASUAL_TALK;
  }

  // 7. Ambiguous single-word inputs
  if (!lower.includes(" ")) {
    return QueryCategory.AMBIGUOUS;
  }

  return null;
};

const buildClassificationPrompt = (input: string) => `
You are classifying requests made to a database analytics system.
The database is READ-ONLY for users.
Classify the user's request into exactly one category: READ_ONLY, WRITE, DDL, PERMISSION, CASUAL_TALK, AMBIGUOUS.

Examples:
"show revenue" -> READ_ONLY
"how to find all properties listed last year? Give me the query for that" -> READ_ONLY
"total sales last month" -> READ_ONLY
"what is the average taxi fare in NYC?" -> READ_ONLY
"compare this month with last month" -> READ_ONLY
"delete inactive users" -> WRITE
"change customer email" -> WRITE
"drop the users table" -> DDL
"create a table" -> DDL
"give me admin access" -> PERMISSION
"hi" -> CASUAL_TALK
"hello" -> CASUAL_TALK
"how are you" -> CASUAL_TALK
"what are you building" -> CASUAL_TALK
"who are you" -> CASUAL_TALK
"revenue" -> AMBIGUOUS
"sales" -> AMBIGUOUS
"backdrop-blur-md border border-zinc-200" -> AMBIGUOUS

Request: ${input}
Category:`;

const parseCategory = (rawOutput: string): QueryCategory => {
  const cleaned = rawOutput.trim().toUpperCase().replace(/\s+/g, "_");

  for (const category of Object.values(QueryCategory)) {
    if (category !== QueryCategory.UNKNOWN && cleaned.includes(category)) {
      return category;
    }
  }

  return QueryCategory.UNKNOWN;
};

export const analyticalValidation = new Tool<
  PromptValidationArgs,
  AnalyticalValidationResult
>({
  name: Tools.ANALYTICAL_VALIDATION,
  description:
    "Classifies and validates the input string into exact database operation categories (READ_ONLY, WRITE, DDL, PERMISSION, AMBIGUOUS).",
  parameters: {
    type: "object",
    properties: {
      input: {
        type: "string",
        description: "The input string to classify.",
      },
    },
    required: ["input"],
  },
  execute: async ({ input }: PromptValidationArgs) => {
    try {
      const quickMatch = quickClassify(input);
      if (quickMatch) {
        return {
          success: true,
          data: {
            category: quickMatch,
            topLabel: quickMatch,
            isAnalytical: quickMatch === QueryCategory.READ_ONLY,
            rawResponse: quickMatch,
          },
        };
      }

      const generator = await getGenerator();
      const prompt = buildClassificationPrompt(input);

      const output = await generator(prompt, {
        max_new_tokens: 128,
        temperature: 0.1,
        do_sample: false,
      });

      const rawResponse = output[0]?.generated_text?.trim() || "";
      const category = parseCategory(rawResponse);
      const isAnalytical = category === QueryCategory.READ_ONLY;

      return {
        success: true,
        data: {
          category,
          topLabel: category,
          isAnalytical,
          rawResponse,
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "Failed to perform analytical validation classification.";

      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});

