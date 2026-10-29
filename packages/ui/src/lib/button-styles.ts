// Без "use client": классы нужны и серверным компонентам (ссылки-кнопки).
export type ButtonVariant = "primary" | "accent" | "outline";
export type ButtonSize = "sm" | "md" | "lg";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 focus-visible:ring-brand-400",
  accent: "bg-accent-600 text-white hover:bg-accent-700 focus-visible:ring-accent-400",
  outline: "border border-ink-200 bg-white text-ink-800 hover:border-ink-300 hover:bg-ink-50 focus-visible:ring-brand-400"
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "min-h-[2.5rem] px-4 py-2 text-[13px]",
  md: "min-h-[2.75rem] px-5 py-3 text-sm",
  lg: "min-h-[3.25rem] px-7 py-4 text-[15px]"
};

// Общие классы кнопки — экспортируются, чтобы ссылки (<a>) выглядели так же.
export function buttonClassName(variant: ButtonVariant = "primary", size: ButtonSize = "md") {
  return `inline-flex items-center justify-center gap-2 rounded-button font-bold uppercase tracking-caps transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]}`;
}

