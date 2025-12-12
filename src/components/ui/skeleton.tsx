import { classNames } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={classNames(
        "animate-pulse rounded-md bg-slate-200/70",
        className,
      )}
    />
  );
}
