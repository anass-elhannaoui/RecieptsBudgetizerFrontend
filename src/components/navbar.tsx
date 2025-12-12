"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./providers/auth-provider";
import { Button } from "./ui/button";

export function Navbar() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  const isAuthRoute = pathname?.startsWith("/login") || pathname?.startsWith("/register");

  if (isAuthRoute) return null;

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm lg:px-6">
      <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-slate-900">
        <span className="rounded bg-sky-600 px-2 py-1 text-xs font-bold uppercase tracking-wide text-white">
          RSB
        </span>
        <span className="hidden sm:inline">Receipt Scanner & Budgetizer</span>
      </Link>
      <div className="flex items-center gap-3">
        <div className="hidden text-sm text-slate-700 sm:block">
          <p className="font-semibold">{user.name ?? "Guest"}</p>
          <p className="text-slate-500">{user?.email ?? ""}</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="Avatar"
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            user?.name?.[0] ?? "?"
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={signOut} className="text-sm">
          <span className="hidden sm:inline">Logout</span>
          <span className="sm:hidden">×</span>
        </Button>
      </div>
    </header>
  );
}
