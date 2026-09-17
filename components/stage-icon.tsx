"use client";

import { StreamEvent, StreamStatus, StreamStage } from "@/utils/stream";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ShieldCheck,
  Terminal,
  BrainCircuit,
  MessageSquare,
  Database,
} from "lucide-react";

export interface StageIconProps {
  event: StreamEvent;
}

export const StageIcon = ({ event }: StageIconProps) => {
  if (event.status === StreamStatus.RUNNING) {
    return <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-600" />;
  }
  if (event.status === StreamStatus.FAILED) {
    return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
  }
  if (event.stage === StreamStage.CASUAL_TALK) {
    return <MessageSquare className="w-3.5 h-3.5 text-amber-600" />;
  }
  if (event.stage === StreamStage.DB_COMMAND_CHECK) {
    return <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />;
  }
  if (event.stage === StreamStage.ANALYTICAL_CLASSIFICATION) {
    return <Sparkles className="w-3.5 h-3.5 text-blue-600" />;
  }
  if (event.stage === StreamStage.PROMPT_EXPANSION) {
    return <BrainCircuit className="w-3.5 h-3.5 text-violet-600" />;
  }
  if (event.stage === StreamStage.QUERY_GENERATION) {
    return <Database className="w-3.5 h-3.5 text-indigo-600" />;
  }
  if (event.stage === StreamStage.STARTED) {
    return <Terminal className="w-3.5 h-3.5 text-zinc-500" />;
  }
  return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
};
