import React from "react";

type RatingBadgeProps = {
  score: number;
  label?: string;
  size?: "sm" | "md" | "lg";
};

export default function RatingBadge({
  score,
  label,
  size = "md",
}: RatingBadgeProps) {
  const displayScore =
    typeof score === "number" ? Math.round(score * 10) / 10 : 0;

  // Determine soft pastel colors based on score
  let bgClass = "bg-[#f0fdf4] text-[#10b981]"; // Green (>70)
  if (score < 40) {
    bgClass = "bg-[#fef2f2] text-[#ef4444]"; // Red (<40)
  } else if (score < 70) {
    bgClass = "bg-[#fffbeb] text-[#f59e0b]"; // Yellow (40-70)
  }

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 rounded-full font-semibold",
    md: "text-sm px-2.5 py-1 rounded-full font-bold",
    lg: "text-base px-3.5 py-1.5 rounded-full font-extrabold",
  };

  return (
    <span
      className={`inline-flex items-center justify-center ${bgClass} ${sizeClasses[size]}`}
    >
      {label && <span className="mr-1 font-normal opacity-85">{label}:</span>}
      {displayScore}
    </span>
  );
}
