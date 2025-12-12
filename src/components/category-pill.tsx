import { ReactNode } from "react";
import { classNames } from "@/lib/utils";

export function CategoryPill({
  label,
  icon,
  tone = "slate",
}: {
  label: string;
  icon?: ReactNode;
  tone?: "slate" | "emerald" | "sky" | "amber" | "violet" | "pink" | "rose";
}) {
  const toneMap: Record<string, string> = {
    slate: "bg-slate-100 text-slate-800",
    emerald: "bg-emerald-100 text-emerald-800",
    sky: "bg-sky-100 text-sky-800",
    amber: "bg-amber-100 text-amber-800",
    violet: "bg-violet-100 text-violet-800",
    pink: "bg-pink-100 text-pink-800",
    rose: "bg-rose-100 text-rose-800",
  };
  return (
    <span
      className={classNames(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold",
        toneMap[tone],
      )}
    >
      {icon && <span>{icon}</span>}
      {label}
    </span>
  );
}
