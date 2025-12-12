import { ReactNode } from "react";
import { classNames } from "@/lib/utils";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: string;
}

export function Card({ children, className, padding = "p-4" }: CardProps) {
  return (
    <div
      className={classNames(
        "rounded-xl border border-slate-200 bg-white shadow-sm",
        padding,
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={classNames("flex items-center justify-between gap-3", className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={classNames("text-lg font-semibold text-slate-900", className)}>{children}</h3>;
}

export function CardDescription({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={classNames("text-sm text-slate-600", className)}>{children}</p>;
}
