"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "accent" | "outline";

const variantClasses: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700",
  accent: "bg-accent-500 text-white hover:bg-accent-600",
  outline: "border border-ink-200 text-ink-700 hover:bg-ink-50"
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}

export function Button({ variant = "primary", className = "", children, ...props }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-card px-5 py-3 text-sm font-semibold transition-colors disabled:opacity-50 ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
