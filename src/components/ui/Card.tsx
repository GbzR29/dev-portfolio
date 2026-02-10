"use client";

import React, { ElementType, HTMLAttributes } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  as?: ElementType;
  padding?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  maxWidth?: string; 
  hoverable?: boolean;
  glow?: boolean;
}

export function Card({
  children,
  className,
  padding = "xl",
  maxWidth = "none",
  as: Component = "div",
  hoverable = true,
  glow = true,
  ...props 
}: CardProps) {
  
  const paddingClasses = {
    none: "p-0",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
    xl: "p-10",
    "2xl": "p-12",
  };

  return (
    <Component
      className={cn(
        "bg-[var(--card)] backdrop-blur-sm rounded-2xl shadow-xl transition-all duration-300",
        paddingClasses[padding],
        glow && "card-glow-animated",
        hoverable && "hover:shadow-2xl hover:border-white/10",
        props.onClick && "cursor-pointer hover:scale-[1.01] active:scale-[0.98]",
        maxWidth !== "none" ? `max-w-${maxWidth}` : "",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}