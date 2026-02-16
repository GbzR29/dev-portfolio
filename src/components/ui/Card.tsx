"use client";

import React, { ElementType, HTMLAttributes, useMemo } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  as?: ElementType;
  padding?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  maxWidth?: string | number | undefined; // aceita '640px', '40rem' ou número (px)
  hoverable?: boolean;
  glow?: boolean;
}

export default function Card({
  children,
  className,
  padding = "xl",
  maxWidth,
  as: Component = "div",
  hoverable = true,
  glow = true,
  ...props
}: CardProps) {
  const paddingClasses = useMemo(
    () => ({
      none: "p-0",
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
      xl: "p-10",
      "2xl": "p-12",
    }),
    []
  );

  const style = useMemo(() => {
    if (!maxWidth) return undefined;
    return { maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth } as React.CSSProperties;
  }, [maxWidth]);

  return (
    <Component
      className={cn(
        "bg-[var(--card)] backdrop-blur-sm rounded-2xl transition-all duration-300 border border-transparent",
        paddingClasses[padding],
        glow && "card-glow-animated",
        hoverable && "hover:shadow-2xl hover:border-white/10",
        props.onClick && "cursor-pointer hover:scale-[1.01] active:scale-[0.98]",
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </Component>
  );
}