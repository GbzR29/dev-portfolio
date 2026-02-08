// components/ui/Card.tsx
"use client";

import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg" | "xl" | "2xl";
  maxWidth?: string;
  onClick?: () => void;
  hoverable?: boolean;
  style?: React.CSSProperties; // Adicione esta linha
}

export function Card({
  children,
  className = "",
  padding = "xl",
  maxWidth = "none",
  onClick,
  hoverable = true,
  style, // Adicione esta linha
}: CardProps) {
  const paddingClasses = {
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
    xl: "p-10",
    "2xl": "p-12",
  };

  return (
    <div
      onClick={onClick}
      className={`
        bg-[var(--card)]
        backdrop-blur-sm       
        card-glow-animated       
        rounded-2xl
        shadow-xl
        ${paddingClasses[padding]}
        ${hoverable ? "transition-all duration-300" : ""}
        ${maxWidth !== "none" ? `max-w-${maxWidth}` : ""}
        ${className}
        ${onClick ? "cursor-pointer hover:scale-[1.02]" : ""}
      `}
      style={style} // Adicione esta linha
    >
      {children}
    </div>
  );
}