import React from "react";

type ProgressiveBlurProps = {
  className?: string;
  backgroundColor?: string;
  position?: "top" | "bottom";
  height?: string;
  blurAmount?: string;
};

export const ProgressiveBlur = ({
  className = "",
  backgroundColor = "transparent",
  position = "top",
  height = "48px",
  blurAmount = "8px",
}: ProgressiveBlurProps) => {
  const isTop = position === "top";

  return (
    <div
      className={`pointer-events-none absolute left-0 right-0 w-full select-none ${className}`}
      style={{
        [isTop ? "top" : "bottom"]: 0,
        height,
        background:
          backgroundColor !== "transparent"
            ? isTop
              ? `linear-gradient(to top, transparent, ${backgroundColor})`
              : `linear-gradient(to bottom, transparent, ${backgroundColor})`
            : undefined,
        maskImage: isTop
          ? `linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)`
          : `linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)`,
        WebkitMaskImage: isTop
          ? `linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)`
          : `linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,0) 100%)`,
        WebkitBackdropFilter: `blur(${blurAmount})`,
        backdropFilter: `blur(${blurAmount})`,
        WebkitUserSelect: "none",
        userSelect: "none",
      }}
    />
  );
};
