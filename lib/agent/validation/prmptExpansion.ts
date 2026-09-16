import { Tool, Tools } from "../tools";
import { pipeline } from "@huggingface/transformers";
import { EXPANSION_MODEL } from "@/lib/constant";


export interface PromptExpansionArgs {
  input: string;
}

export interface PromptExpansionResult {
  originalPrompt: string;
  expandedPrompt: string;
  generatedText: string;
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
      EXPANSION_MODEL,
    ) as unknown as Promise<TextGenerator>;
  }
  return generatorPromise;
};

const cleanRepeatedSentences = (text: string): string => {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const seen = new Set<string>();
  const uniqueSentences: string[] = [];

  for (const sentence of sentences) {
    const normalized = sentence.toLowerCase().replace(/[^\w\s]/g, "");
    if (!seen.has(normalized) && normalized.length > 3) {
      seen.add(normalized);
      uniqueSentences.push(sentence);
    }
  }

  return uniqueSentences.length > 0 ? uniqueSentences.join(" ") : text;
};

const buildExpansionPrompt = (input: string) =>
  `Provide a concise analytical database query specification with metrics, timeframe filters, and aggregations for: "${input.trim()}"`;

export const promptExpansion = new Tool<
  PromptExpansionArgs,
  PromptExpansionResult
>({
  name: Tools.PROMPT_EXPANSION,
  description:
    "Expands the input prompt using a Hugging Face model into a detailed analytical database specification.",
  parameters: {
    type: "object",
    properties: {
      input: {
        type: "string",
        description:
          "The user query prompt to expand using the Hugging Face model.",
      },
    },
    required: ["input"],
  },
  execute: async ({ input }: PromptExpansionArgs) => {
    try {
      const generator = await getGenerator();
      const prompt = buildExpansionPrompt(input);

      const output = await generator(prompt, {
        max_new_tokens: 512,
        temperature: 0.3,
        do_sample: true,
        repetition_penalty: 1.3,
        no_repeat_ngram_size: 3,
      } as Record<string, unknown>);

      let rawGenerated = output[0]?.generated_text?.trim() || "";
      rawGenerated = rawGenerated.replace(/^Query:\s*"?|"?$/gi, "").trim();
      const cleaned = cleanRepeatedSentences(rawGenerated);

      const expandedPrompt =
        cleaned &&
        cleaned.length > 5 &&
        cleaned.toLowerCase() !== input.toLowerCase().trim()
          ? cleaned
          : `Analytical specification for "${input.trim()}": compute target metrics, apply date filters, and generate aggregated summary.`;

      return {
        success: true,
        data: {
          originalPrompt: input,
          expandedPrompt,
          generatedText: cleaned || rawGenerated,
        },
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === "string"
            ? error
            : "Failed to expand prompt using Hugging Face model.";

      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});

