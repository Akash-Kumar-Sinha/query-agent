"use client";
import React from "react";
import { cn } from "@/lib/utils";
interface TextureBgProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  opacity?: number;
  baseFrequency?: number;
  numOctaves?: number;
  blendMode?: React.CSSProperties["mixBlendMode"];
}
export const TextureBg = ({
  children,
  className,
  opacity = 0.4,
  baseFrequency = 1.2,
  numOctaves = 3,
  blendMode = "multiply",
  ...props
}: TextureBgProps) => {
  const noiseUrl = `data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='${baseFrequency}' numOctaves='${numOctaves}' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E`;
  return (
    <div
      className={cn(
        "relative w-full overflow-hidden",
        className,
      )}
      {...props}
    >
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `url("${noiseUrl}")`,
          opacity: opacity,
          mixBlendMode: blendMode,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
};
