"use client";

import React, { InputHTMLAttributes } from "react";
import clsx from "clsx";

interface InputBoxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function InputBox({
  label,
  error,
  icon,
  className,
  ...props
}: InputBoxProps) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {label && (
        <label className="text-sm font-medium text-[var(--text-muted)] ml-1">
          {label}
        </label>
      )}

      {/* Container que recebe o efeito de Glow */}
      <div className="input-glow-animated group">
        <div className="relative flex items-center z-10">
          {icon && (
            <div className="absolute left-4 text-[var(--text-muted)] group-focus-within:text-[var(--primary)] transition-colors">
              {icon}
            </div>
          )}
          
          <input
            className={clsx(
              `
              w-full bg-transparent 
              text-[var(--text-main)] 
              py-3 px-4 
              rounded-xl 
              outline-none 
              placeholder:text-[var(--text-muted)]/40
              `,
              icon && "pl-12",
              className
            )}
            {...props}
          />
        </div>
      </div>

      {error && (
        <span className="text-xs text-red-500 ml-1">{error}</span>
      )}
    </div>
  );
}