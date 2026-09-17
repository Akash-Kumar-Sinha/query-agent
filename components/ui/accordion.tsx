"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccordionContextType {
  openItems: string[];
  toggleItem: (value: string) => void;
  type?: "single" | "multiple";
}

const AccordionContext = createContext<AccordionContextType | null>(null);

const useAccordion = () => {
  const context = useContext(AccordionContext);
  if (!context) {
    throw new Error("Accordion components must be used within an Accordion provider");
  }
  return context;
};

export interface AccordionProps {
  type?: "single" | "multiple";
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  children: ReactNode;
  className?: string;
}

export const Accordion = ({
  type = "single",
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}: AccordionProps) => {
  const [internalState, setInternalState] = useState<string[]>(() => {
    if (defaultValue) {
      return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
    }
    return [];
  });

  const openItems = value !== undefined
    ? (Array.isArray(value) ? value : [value])
    : internalState;

  const toggleItem = (itemValue: string) => {
    let nextItems: string[];
    if (type === "single") {
      nextItems = openItems.includes(itemValue) ? [] : [itemValue];
    } else {
      nextItems = openItems.includes(itemValue)
        ? openItems.filter((i) => i !== itemValue)
        : [...openItems, itemValue];
    }

    if (value === undefined) {
      setInternalState(nextItems);
    }
    if (onValueChange) {
      onValueChange(type === "single" ? (nextItems[0] || "") : nextItems);
    }
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, type }}>
      <div className={cn("flex flex-col gap-2 w-full", className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

interface AccordionItemContextType {
  value: string;
  isOpen: boolean;
}

const AccordionItemContext = createContext<AccordionItemContextType | null>(null);

export interface AccordionItemProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export const AccordionItem = ({
  value,
  children,
  className,
}: AccordionItemProps) => {
  const { openItems } = useAccordion();
  const isOpen = openItems.includes(value);

  return (
    <AccordionItemContext.Provider value={{ value, isOpen }}>
      <div
        className={cn(
          "rounded-xl border border-zinc-200/80 bg-white/90 overflow-hidden shadow-xs transition-colors",
          className,
        )}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  );
};

export interface AccordionTriggerProps {
  children: ReactNode;
  className?: string;
  showChevron?: boolean;
}

export const AccordionTrigger = ({
  children,
  className,
  showChevron = true,
}: AccordionTriggerProps) => {
  const { toggleItem } = useAccordion();
  const itemContext = useContext(AccordionItemContext);

  if (!itemContext) {
    throw new Error("AccordionTrigger must be used within an AccordionItem");
  }

  const { value, isOpen } = itemContext;

  return (
    <button
      type="button"
      onClick={() => toggleItem(value)}
      className={cn(
        "flex w-full items-center justify-between px-3 py-2 text-left transition-colors cursor-pointer select-none",
        "hover:bg-zinc-50/80",
        className,
      )}
    >
      <div className="flex-1 truncate">{children}</div>
      {showChevron && (
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="inline-flex shrink-0 ml-2 text-zinc-500"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </motion.span>
      )}
    </button>
  );
};

export interface AccordionContentProps {
  children: ReactNode;
  className?: string;
}

export const AccordionContent = ({
  children,
  className,
}: AccordionContentProps) => {
  const itemContext = useContext(AccordionItemContext);

  if (!itemContext) {
    throw new Error("AccordionContent must be used within an AccordionItem");
  }

  const { isOpen } = itemContext;

  return (
    <AnimatePresence initial={false}>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="overflow-hidden border-t border-zinc-200/70 bg-zinc-50/60"
        >
          <div className={cn("p-3", className)}>{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
