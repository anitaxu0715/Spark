import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "quiet" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-coral-500 text-white shadow-sm hover:bg-coral-600",
  secondary: "border border-indigo-200 bg-white text-indigo-900 hover:border-indigo-300 hover:bg-indigo-50",
  quiet: "text-indigo-800 hover:bg-indigo-50",
  danger: "border border-red-200 bg-white text-red-700 hover:bg-red-50",
};

export function buttonStyles(variant: Variant = "primary", className = "") {
  return [
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-coral-300 disabled:cursor-not-allowed disabled:opacity-55",
    variants[variant],
    className,
  ].join(" ");
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", className = "", ...props },
  ref,
) {
  return <button className={buttonStyles(variant, className)} ref={ref} {...props} />;
});
