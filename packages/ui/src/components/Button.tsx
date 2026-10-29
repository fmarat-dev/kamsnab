"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

import { buttonClassName, type ButtonVariant, type ButtonSize } from "../lib/button-styles";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

export function Button({ variant = "primary", size = "md", className = "", children, ...props }: ButtonProps) {
  return (
    <button className={`${buttonClassName(variant, size)} ${className}`} {...props}>
      {children}
    </button>
  );
}
