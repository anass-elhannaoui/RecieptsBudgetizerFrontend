"use client";

import { Navbar } from "./navbar";
import { Sidebar } from "./sidebar";

export function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 pb-20 lg:px-8 lg:pb-6">
        <Sidebar />
        <main className="w-full flex-1 space-y-6">{children}</main>
      </div>
    </div>
  );
}
