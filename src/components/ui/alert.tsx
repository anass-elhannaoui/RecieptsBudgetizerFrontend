import { ReactNode } from "react";
import { classNames } from "@/lib/utils";

type Tone = "info" | "success" | "warning" | "danger";

const toneStyles: Record<Tone, string> = {
  info: "bg-sky-50 border-sky-200 text-sky-800",
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  danger: "bg-rose-50 border-rose-200 text-rose-800",
};

export function Alert({
  tone = "info",
  title,
  description,
  actions,
  className,
}: {
  tone?: Tone;
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={classNames(
        "flex flex-col gap-2 rounded-xl border px-4 py-3 text-sm shadow-sm",
        toneStyles[tone],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold">{title}</p>
          {description && <p className="text-sm text-inherit/80">{description}</p>}
        </div>
        {actions}
      </div>
    </div>
  );
}
