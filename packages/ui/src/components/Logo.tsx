export interface LogoProps {
  // light — на тёмном фоне (подвал): «КАМ» белым, «СНАБ» brand-400.
  tone?: "dark" | "light";
  className?: string;
}

export function Logo({ tone = "dark", className = "" }: LogoProps) {
  return (
    <span
      className={`font-display font-bold uppercase leading-none tracking-logo ${
        tone === "light" ? "text-white" : "text-ink-800"
      } ${className}`}
    >
      КАМ<span className={tone === "light" ? "text-brand-400" : "text-brand-600"}>СНАБ</span>
    </span>
  );
}
