"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { classNames } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/scan", label: "Scan / Upload", icon: "📸" },
  { href: "/receipts", label: "Receipts", icon: "🧾" },
  { href: "/budgets", label: "Budgets", icon: "💰" },
  { href: "/weekly-report", label: "Weekly Report", icon: "📈" },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-sky-600 text-white shadow-lg lg:hidden"
        aria-label="Toggle menu"
      >
        {mobileOpen ? "×" : "☰"}
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={classNames(
          "fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200 bg-white transition-transform duration-300 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <nav className="p-4">
          <div className="mb-4 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Navigation
          </div>
          <div className="flex flex-col gap-1">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={classNames(
                  "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-sky-50 text-sky-700"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                <span className="flex items-center gap-2">
                  <span>{link.icon}</span>
                  <span>{link.label}</span>
                </span>
                {active && <span className="text-xs text-sky-600">●</span>}
              </Link>
            );
          })}
        </div>
      </nav>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden w-60 flex-shrink-0 border-r border-slate-200 bg-white lg:block">
        <nav className="p-4">
          <div className="mb-4 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Navigation
          </div>
          <div className="flex flex-col gap-1">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={classNames(
                    "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sky-50 text-sky-700"
                      : "text-slate-700 hover:bg-slate-50 hover:text-slate-900",
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span>{link.icon}</span>
                    <span>{link.label}</span>
                  </span>
                  {active && <span className="text-xs text-sky-600">●</span>}
                </Link>
              );
            })}
          </div>
        </nav>
      </aside>
    </>
  );
}
