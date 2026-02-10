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
  maxWidth?: string; // Adicionei aqui para podermos extraí-lo
  hoverable?: boolean;
  glow?: boolean;
}

export function Card({
  children,
  className,
  padding = "xl",
  maxWidth = "none", // Extraímos maxWidth aqui
  as: Component = "div",
  hoverable = true,
  glow = true,
  ...props // Agora o 'props' contém apenas atributos HTML válidos
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
        // Aplicamos a lógica do maxWidth na classe do Tailwind, não no DOM
        maxWidth !== "none" ? `max-w-${maxWidth}` : "",
        className
      )}
      {...props} // Agora o React não verá o 'maxWidth' aqui dentro
    >
      {children}
    </Component>
  );
}