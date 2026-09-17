"use client";

import React, { useRef, useEffect } from "react";

import { ChevronUp } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { cn } from "@/lib/utils";

export interface PromptInputProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  maxLength?: number;
}

const roundnessClass = "rounded-xl sm:rounded-2xl";

const container_theme = cn(
  "bg-white/10 backdrop-blur-xs border border-black",
  "shadow-[0_1px_3px_rgba(0,0,0,0.05),0_10px_40px_rgba(0,0,0,0.08)]",
  "focus-within:shadow-[0_1px_4px_rgba(0,0,0,0.08),0_15px_50px_rgba(0,0,0,0.12)]",
);

const scrollbar = cn(
  "[scrollbar-width:thin] [scrollbar-color:rgba(0,0,0,0.2)_transparent]",
  "[&::-webkit-scrollbar]:w-1.5",
  "[&::-webkit-scrollbar-track]:bg-transparent",
  "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-black/10",
  "hover:[&::-webkit-scrollbar-thumb]:bg-black/25",
);

export const PromptInput = ({
  value,
  onChange,
  onSubmit,
  isLoading,
  placeholder = "Describe what you want to build...",
  disabled = false,
  className,
  maxLength,
}: PromptInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSubmit = !disabled && !isLoading && value.trim().length > 0;

  const showCounter =
    maxLength !== undefined && value.length >= Math.floor(maxLength * 0.8);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const resize = () => {
      if (isLoading) {
        el.style.height = "24px";
        return;
      }
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [value, isLoading]);

  // Enter submits; Shift+Enter inserts a newline. Enter is always swallowed so
  // it never leaves a stray newline behind when the prompt isn't submittable.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== "Enter" || e.shiftKey) return;
    e.preventDefault();
    if (canSubmit) onSubmit();
  };

  return (
    <div
      className={cn(
        "relative w-full p-2.5 sm:p-3 md:p-4 flex flex-col gap-2 sm:gap-3",
        roundnessClass,
        "transition-shadow duration-300 ease-out",
        container_theme,
        disabled && "opacity-50 cursor-not-allowed",
        className,
      )}
    >
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled || isLoading}
        maxLength={maxLength}
        rows={1}
        className={cn(
          "w-full resize-none bg-transparent",
          "text-sm sm:text-base text-black leading-6 placeholder:text-black/20",
          "focus:outline-none",
          isLoading ? "overflow-hidden" : "overflow-y-auto",
          "custom-scroll",
          "transition-[height] duration-300 ease-out",
          (disabled || isLoading) && "cursor-not-allowed",
        )}
        style={{ minHeight: "24px", maxHeight: "160px" }}
      />

      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium tracking-[0.14em] uppercase text-black/20 select-none">
          Enter
        </span>

        <div className="flex items-center gap-3">
          {showCounter && !isLoading && (
            <span className="font-mono text-[10px] text-black/70 tabular-nums select-none">
              {value.length}/{maxLength}
            </span>
          )}

          <AnimatePresence mode="wait" initial={false}>
            {isLoading ? (
              <motion.div
                key="dots"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center justify-center gap-[5px] w-8 h-8 sm:w-9 sm:h-9"
              >
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="block w-[5px] h-[5px] rounded-full bg-black/70"
                    animate={{
                      opacity: [0.25, 1, 0.25],
                      scale: [0.85, 1, 0.85],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: i * 0.18,
                    }}
                  />
                ))}
              </motion.div>
            ) : (
              <motion.button
                key="send"
                type="button"
                aria-label="Send message"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                whileTap={{ scale: 0.92 }}
                onClick={canSubmit ? onSubmit : undefined}
                disabled={!canSubmit}
                className={cn(
                  "flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9",
                  "transition-colors duration-200 focus:outline-none",
                  roundnessClass,
                  canSubmit
                    ? "text-black hover:text-black"
                    : "text-black/20",
                  !canSubmit && "cursor-not-allowed bg-transparent",
                )}
              >
                <ChevronUp className={cn("w-4 h-4 sm:w-[18px] sm:h-[18px]")} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
