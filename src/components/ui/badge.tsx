import { ReactNode } from "react";
import { classNames } from "@/lib/utils";

type Tone = "default" | "success" | "warning" | "danger" | "info";

const toneClasses: Record<Tone, string> = {
  default: "bg-slate-100 text-slate-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-rose-100 text-rose-700",
  info: "bg-sky-100 text-sky-700",
};

export function Badge({
  tone = "default",
  children,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={classNames(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
