"use client";

import React, { ElementType, HTMLAttributes } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Função utilitária para combinar classes Tailwind sem conflitos
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  as?: ElementType; // Permite mudar a tag HTML (div, section, article...)
  padding?: "none" | "sm" | "md" | "lg" | "xl" | "2xl";
  hoverable?: boolean;
  glow?: boolean; // Opção de ligar/desligar o efeito de animação
}

export function Card({
  children,
  className,
  padding = "xl",
  as: Component = "div",
  hoverable = true,
  glow = true,
  ...props // Captura todas as outras propriedades (onClick, onMouseEnter, id, etc)
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
        // Classes Base
        "bg-[var(--card)] backdrop-blur-sm rounded-2xl shadow-xl transition-all duration-300",
        // Padding Dinâmico
        paddingClasses[padding],
        // Efeito de Glow Condicional
        glow && "card-glow-animated",
        // Hover Condicional
        hoverable && "hover:shadow-2xl hover:border-white/10",
        // Click Condicional
        props.onClick && "cursor-pointer hover:scale-[1.01] active:scale-[0.98]",
        // Classes extras enviadas via props (sobrescrevem as anteriores)
        className
      )}
      {...props}
    >
      {children}
    </Component>
  );
}