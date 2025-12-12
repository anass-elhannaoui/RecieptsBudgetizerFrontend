"use client";

import { SelectHTMLAttributes, forwardRef, ReactNode } from "react";
import { classNames } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: Option[];
  leftIcon?: ReactNode;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options = [], className, leftIcon, children, ...props }, ref) => {
    return (
      <label className="flex w-full flex-col gap-1 text-sm font-medium text-slate-700">
        {label}
        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              {leftIcon}
            </span>
          )}
          <select
            ref={ref}
            className={classNames(
              "w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-100",
              leftIcon && "pl-9",
              error && "border-rose-400 focus:border-rose-400 focus:ring-rose-100",
              className,
            )}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
            {children}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
            ▾
          </span>
        </div>
        {error && <span className="text-xs text-rose-600">{error}</span>}
      </label>
    );
  },
);

Select.displayName = "Select";
