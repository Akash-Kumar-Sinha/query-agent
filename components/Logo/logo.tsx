import React from "react";
import { cn } from "@/lib/utils";

export interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
  showText?: boolean;
  textClassName?: string;
}

export const LogoIcon = ({
  size = 28,
  className,
  ...props
}: Omit<LogoProps, "showText" | "textClassName">) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 transition-transform duration-200 hover:scale-105", className)}
      aria-label="Query Agent Logo"
      {...props}
    >
      {/* Outer Rounded Container */}
      <rect
        x="2"
        y="2"
        width="28"
        height="28"
        rx="7"
        fill="#000000"
        stroke="#27272a"
        strokeWidth="1"
      />

      {/* Database Column / Query Stack Elements - Pure Monochrome */}
      {/* Top Ellipse */}
      <ellipse
        cx="16"
        cy="10.5"
        rx="7"
        ry="2.75"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Middle Layer */}
      <path
        d="M9 10.5v5c0 1.519 3.134 2.75 7 2.75s7-1.231 7-2.75v-5"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.6"
      />

      {/* Bottom Layer */}
      <path
        d="M9 15.5v5c0 1.519 3.134 2.75 7 2.75s7-1.231 7-2.75v-5"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Central Query Node / Spark */}
      <circle cx="16" cy="10.5" r="1.25" fill="#ffffff" />

      {/* Minimal Query Spark Indicator */}
      <circle cx="21" cy="21.5" r="1.25" fill="#ffffff" />
      <path
        d="M22 22.5L24 24.5"
        stroke="#ffffff"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

export const Logo = ({
  size = 28,
  className,
  showText = true,
  textClassName,
  ...props
}: LogoProps) => {
  return (
    <div className={cn("inline-flex items-center gap-2 select-none", className)}>
      <LogoIcon size={size} {...props} />
      {showText && (
        <span
          className={cn(
            "text-sm font-semibold tracking-tight text-zinc-900 font-sans",
            textClassName,
          )}
        >
          Query<span className="font-bold text-black">Agent</span>
        </span>
      )}
    </div>
  );
};
