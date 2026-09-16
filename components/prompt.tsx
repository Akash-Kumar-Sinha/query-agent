"use client";

import { PromptInput } from "@/components/ui/prompt-input";
import { useState } from "react";

export const Prompt = () => {
  const [value, setValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!value.trim() || isLoading) return;

    const currentPrompt = value;
    setIsLoading(true);

    try {
      const response = await fetch("/api/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: currentPrompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit prompt");
      }

      console.log("API Response:", data);
      setValue("");
    } catch (error) {
      console.error("Error sending prompt to API:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PromptInput
      className="w-full max-w-2xl"
      value={value}
      onChange={setValue}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      placeholder="Ask me anything about your database..."
      maxLength={2000}
    />
  );
};
