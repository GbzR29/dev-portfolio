"use client";

import { ButtonHTMLAttributes, ReactNode } from "react"; // Importamos ReactNode
import clsx from "clsx";

interface MyButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  variant?: "primary" | "outline";
  icon?: ReactNode;
}

export function MyButton({
  text,
  variant = "primary",
  className,
  icon, 
  ...props
}: MyButtonProps) {
  const base =
    "px-6 py-2 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2";

  const styles = {
    primary:
      "bg-blue-500 text-white hover:bg-blue-400 hover:shadow-[0_0_25px_rgba(59,130,246,0.6)]",

    outline:
      "border border-blue-500 text-blue-400 hover:bg-blue-500/10 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]"
  };

  return (
    <button
      className={clsx(base, styles[variant], className)}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{text}</span>
    </button>
  );
}