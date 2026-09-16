"use client";

import { PromptInput } from "@/components/ui/prompt-input";
import { useState } from "react";

export const Prompt = () => {
  const [value, setValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    setTimeout(() => {
      console.log("Submitted value:", value);
    }, 3000);
    setIsLoading(false);
    setValue("");
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
