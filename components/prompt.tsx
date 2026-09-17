"use client";

import { useState, useRef, useEffect } from "react";
import { PromptInput } from "@/components/ui/prompt-input";
import { ValidationStages } from "@/components/validation-stages";
import { StreamEvent } from "@/utils/stream";
import { motion, AnimatePresence } from "motion/react";
import { User } from "lucide-react";

interface ChatTurn {
  id: string;
  prompt: string;
  events: StreamEvent[];
  timestamp: string;
}

export const Prompt = () => {
  const [value, setValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [turns]);

  const handleSubmit = async () => {
    if (!value.trim() || isLoading) return;

    const currentPrompt = value;
    const turnId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setValue("");
    setIsLoading(true);

    const newTurn: ChatTurn = {
      id: turnId,
      prompt: currentPrompt,
      events: [],
      timestamp: new Date().toISOString(),
    };

    setTurns((prev) => [...prev, newTurn]);

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: currentPrompt }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;

        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("data: ")) {
            try {
              const event: StreamEvent = JSON.parse(trimmed.slice(6));
              setTurns((prev) =>
                prev.map((turn) => {
                  if (turn.id !== turnId) return turn;
                  const existingIndex = turn.events.findIndex(
                    (e) => e.stage === event.stage,
                  );
                  let nextEvents: StreamEvent[];
                  if (existingIndex >= 0) {
                    nextEvents = [...turn.events];
                    nextEvents[existingIndex] = event;
                  } else {
                    nextEvents = [...turn.events, event];
                  }
                  return { ...turn, events: nextEvents };
                }),
              );
            } catch (err) {
              console.error("Failed to parse SSE event chunk:", trimmed, err);
            }
          }
        }
      }
    } catch (error: unknown) {
      console.error("Error streaming validation response:", error);
      const errorMsg =
        error instanceof Error ? error.message : "Failed to stream validation";
      setTurns((prev) =>
        prev.map((turn) => {
          if (turn.id !== turnId) return turn;
          return {
            ...turn,
            events: [
              ...turn.events,
              {
                stage: "error",
                status: "failed",
                message: errorMsg,
                timestamp: new Date().toISOString(),
              },
            ],
          };
        }),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {turns.length > 0 && (
        <div
          className="w-full max-w-2xl flex flex-col gap-6 max-h-[58vh] overflow-y-auto px-1 pt-6 pb-2 select-none custom-scroll transition-all duration-300"
          style={{
            maskImage:
              "linear-gradient(to bottom, transparent 0%, black 36px, black 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, black 36px, black 100%)",
          }}
        >
          <AnimatePresence initial={false}>
            {turns.map((turn) => (
              <motion.div
                key={turn.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex flex-col gap-3 w-full"
              >
                <div className="flex items-start justify-end gap-2.5 self-end max-w-[85%]">
                  <div className="flex flex-col items-end gap-1">
                    <div className="px-4 py-2 rounded-2xl bg-zinc-900 text-zinc-100 text-xs font-mono shadow-xs select-text leading-relaxed">
                      {turn.prompt}
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono px-1">
                      {new Date(turn.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="w-6 h-6 rounded-full bg-zinc-100 border border-zinc-300/80 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <User className="w-3.5 h-3.5 text-zinc-600" />
                  </div>
                </div>

                <ValidationStages events={turn.events} />
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={chatBottomRef} />
        </div>
      )}

      <PromptInput
        className="w-full max-w-2xl"
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        isLoading={isLoading}
        placeholder="Ask me anything about your database..."
        maxLength={2000}
      />
    </div>
  );
};

