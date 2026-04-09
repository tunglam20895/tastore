"use client";

import { memo } from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "full";
  className?: string;
  label?: string;
}

/**
 * Loading spinner sử dụng SVG logo xoay 360°
 * Kích thước: sm (16px) dùng cho button, md (32px) cho section, lg (64px) cho card, full cho trang
 */
const LoadingSpinner = memo(function LoadingSpinner({
  size = "md",
  className = "",
  label,
}: LoadingSpinnerProps) {
  const sizeClasses: Record<string, string> = {
    sm: "w-4 h-4",
    md: "w-8 h-8",
    lg: "w-16 h-16",
    full: "w-24 h-24",
  };

  const textSizeClasses: Record<string, string> = {
    sm: "text-[8px]",
    md: "text-[10px]",
    lg: "text-xs",
    full: "text-sm",
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div
        className={`${sizeClasses[size]} animate-spin`}
        style={{
          animationDuration: size === "full" ? "2.5s" : "1.5s",
          animationTimingFunction: "linear",
        }}
      >
        {/* SVG logo — monogram "TA" xoay tròn */}
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Vòng tròn ngoài — blush */}
          <circle
            cx="24"
            cy="24"
            r="22"
            stroke="var(--color-blush, #C8A991)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            opacity="0.6"
          />
          {/* Vòng tròn trong — espresso */}
          <circle
            cx="24"
            cy="24"
            r="18"
            stroke="var(--color-espresso, #1A0A04)"
            strokeWidth="1"
            opacity="0.3"
          />
          {/* Chữ T (ở trên) */}
          <path
            d="M18 16h12M24 16v7"
            stroke="var(--color-espresso, #1A0A04)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Chữ A (ở dưới) */}
          <path
            d="M19 34l4.5-11M24 23l4.5 11M20.5 30h7"
            stroke="var(--color-espresso, #1A0A04)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Điểm nhấn nhỏ — rose */}
          <circle cx="24" cy="6" r="1.5" fill="var(--color-rose, #A8705F)" opacity="0.7" />
        </svg>
      </div>
      {label && (
        <p
          className={`${textSizeClasses[size]} uppercase tracking-[0.2em] text-stone-400 animate-pulse`}
        >
          {label}
        </p>
      )}
    </div>
  );
});

export default LoadingSpinner;
