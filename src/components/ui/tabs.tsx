"use client";

import { ReactNode, useState } from "react";
import { classNames } from "@/lib/utils";

export interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

export function Tabs({ tabs, defaultTab }: { tabs: Tab[]; defaultTab?: string }) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id);

  const activeContent = tabs.find((t) => t.id === active)?.content;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            className={classNames(
              "rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
              active === tab.id
                ? "border-sky-500 bg-sky-50 text-sky-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div>{activeContent}</div>
    </div>
  );
}
