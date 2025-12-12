import { ReactNode } from "react";
import { Card, CardDescription, CardTitle } from "./ui/card";

export function StatWidget({
  label,
  value,
  icon,
  delta,
  tone = "info",
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  delta?: string;
  tone?: "info" | "success" | "warning" | "danger";
}) {
  const toneColor: Record<typeof tone, string> = {
    info: "text-sky-600",
    success: "text-emerald-600",
    warning: "text-amber-600",
    danger: "text-rose-600",
  } as const;

  return (
    <Card className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <CardDescription className="font-semibold uppercase tracking-wide text-[11px] text-slate-500">
          {label}
        </CardDescription>
        {icon && <span className="text-xl text-slate-400">{icon}</span>}
      </div>
      <CardTitle className="text-3xl font-bold text-slate-900">{value}</CardTitle>
      {delta && <span className={`text-sm font-medium ${toneColor[tone]}`}>{delta}</span>}
    </Card>
  );
}
