"use client";

import { InputHTMLAttributes, forwardRef } from "react";
import { classNames } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <label className="flex w-full flex-col gap-1 text-sm font-medium text-slate-700">
        {label}
        <input
          ref={ref}
          className={classNames(
            "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100",
            error && "border-rose-400 focus:border-rose-400 focus:ring-rose-100",
            className,
          )}
          {...props}
        />
        {error && <span className="text-xs text-rose-600">{error}</span>}
      </label>
    );
  },
);

Input.displayName = "Input";
