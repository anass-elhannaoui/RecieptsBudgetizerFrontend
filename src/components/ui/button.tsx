"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";
import { classNames } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
}

const baseClasses =
  "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-sky-600 text-white hover:bg-sky-700 focus-visible:outline-sky-500",
  secondary:
    "bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:outline-slate-400",
  ghost:
    "bg-transparent text-slate-700 hover:bg-slate-100 focus-visible:outline-slate-300",
  danger:
    "bg-rose-600 text-white hover:bg-rose-700 focus-visible:outline-rose-500",
};

const sizeClasses: Record<Size, string> = {
  sm: "text-sm px-3 py-2 gap-2",
  md: "text-sm px-4 py-2.5 gap-2.5",
  lg: "text-base px-5 py-3 gap-3",
};

export function Button({
  variant = "primary",
  size = "md",
  iconLeft,
  iconRight,
  loading,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={classNames(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      {...props}
    >
      {iconLeft}
      {loading ? "Loading..." : children}
      {iconRight}
    </button>
  );
}
