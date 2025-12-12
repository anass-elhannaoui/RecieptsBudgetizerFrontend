import { ReactNode } from "react";
import { classNames } from "@/lib/utils";

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm">
      <table className={classNames("min-w-full divide-y divide-slate-200 bg-white", className)}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-slate-200 text-sm text-slate-700">{children}</tbody>;
}

export function TR({ children, className }: { children: ReactNode; className?: string }) {
  return <tr className={classNames("hover:bg-slate-50", className)}>{children}</tr>;
}

export function TH({ children, className }: { children: ReactNode; className?: string }) {
  return <th className={classNames("px-4 py-3 font-semibold", className)}>{children}</th>;
}

export function TD({ children, className }: { children: ReactNode; className?: string }) {
  return <td className={classNames("px-4 py-3", className)}>{children}</td>;
}
