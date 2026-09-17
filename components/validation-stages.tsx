"use client";

import { StreamEvent, StreamStatus, StreamStage } from "@/utils/stream";
import { AnimatePresence, motion } from "motion/react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { StageIcon } from "@/components/stage-icon";
import { ExpansionViewer } from "@/components/expansion-viewer";
import { AssistantResponseCard } from "@/components/assistant-response-card";
import { SqlQueryViewer } from "@/components/sql-query-viewer";

export interface ValidationStagesProps {
  events: StreamEvent[];
  className?: string;
}

export const ValidationStages = ({
  events,
  className,
}: ValidationStagesProps) => {
  if (!events || events.length === 0) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2 }}
        className={cn("w-full max-w-2xl flex flex-col gap-2", className)}
      >
        <Accordion type="multiple" defaultValue={[]}>
          {events.map((event, idx) => {
            const expansionData =
              event.stage === StreamStage.PROMPT_EXPANSION &&
              event.status === StreamStatus.SUCCESS &&
              typeof event.data === "object" &&
              event.data !== null
                ? (event.data as {
                    expandedPrompt?: string;
                    generatedText?: string;
                  })
                : null;

            const queryData =
              event.stage === StreamStage.QUERY_GENERATION &&
              event.status === StreamStatus.SUCCESS &&
              typeof event.data === "object" &&
              event.data !== null
                ? (event.data as {
                    sql?: string;
                    explanation?: string;
                    dialect?: string;
                  })
                : null;

            const fullText =
              expansionData?.expandedPrompt || expansionData?.generatedText;
            const itemKey = `stage-${event.stage}-${idx}`;

            if (queryData && queryData.sql) {
              return (
                <SqlQueryViewer
                  key={itemKey}
                  sql={queryData.sql}
                  explanation={queryData.explanation}
                  dialect={queryData.dialect}
                />
              );
            }

            if (fullText) {
              return (
                <AccordionItem
                  key={itemKey}
                  value={`stage-${event.stage}`}
                  className="border-zinc-200/80 bg-white/95"
                >
                  <AccordionTrigger className="gap-2.5">
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="shrink-0">
                        <StageIcon event={event} />
                      </span>
                      <span className="truncate text-xs font-mono text-zinc-700">
                        {event.message}
                      </span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <ExpansionViewer text={fullText} />
                  </AccordionContent>
                </AccordionItem>
              );
            }

            if (event.stage === StreamStage.CASUAL_TALK) {
              return <AssistantResponseCard key={itemKey} event={event} />;
            }

            return (
              <div
                key={itemKey}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-xl border border-zinc-200/80 bg-white/95 transition-colors shadow-xs",
                  event.status === StreamStatus.RUNNING &&
                    "bg-zinc-50 text-zinc-800 font-medium",
                  event.status === StreamStatus.SUCCESS && "text-zinc-700",
                  event.status === StreamStatus.FAILED &&
                    "bg-red-50/60 border-red-200 text-red-600 font-medium",
                )}
              >
                <span className="shrink-0">
                  <StageIcon event={event} />
                </span>
                <span className="flex-1 truncate text-xs font-mono">
                  {event.message}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono shrink-0">
                  {new Date(event.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              </div>
            );
          })}
        </Accordion>
      </motion.div>
    </AnimatePresence>
  );
};

export {
  StageIcon,
  ExpansionViewer,
  AssistantResponseCard,
  SqlQueryViewer,
};
