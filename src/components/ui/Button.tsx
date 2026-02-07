import { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

interface MyButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  variant?: "primary" | "outline";
}

export function MyButton({
  text,
  variant = "primary",
  className,
  ...props
}: MyButtonProps) {

  const base =
    "px-6 py-2 rounded-lg font-medium transition-all duration-300";

  const styles = {
    primary:
      "bg-blue-500 text-black hover:bg-blue-400 hover:shadow-[0_0_25px_rgba(59,130,246,0.6)]",

    outline:
      "border border-blue-500 text-blue-400 hover:bg-blue-500/10 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]"
  };

  return (
    <button
      className={clsx(base, styles[variant], className)}
      {...props}
    >
      {text}
    </button>
  );
}
