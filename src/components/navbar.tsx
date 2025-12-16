"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "./providers/auth-provider";
import { Button } from "./ui/button";
import { LogOut, Receipt } from "lucide-react";

export function Navbar() {
  const { user, signOut } = useAuth();
  const pathname = usePathname();

  const isAuthRoute = pathname?.startsWith("/login") || pathname?.startsWith("/register");

  if (isAuthRoute) return null;

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
      <Link href="/dashboard" className="flex items-center gap-3 group">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 shadow-md">
          <Receipt className="w-5 h-5 text-white" />
        </div>
        <div className="hidden sm:flex flex-col">
          <span className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">Receipt Scanner</span>
          <span className="text-xs text-slate-500 font-medium">Budgetizer & Analytics</span>
        </div>
      </Link>
      <div className="flex items-center gap-4">
        <div className="hidden md:flex flex-col items-end">
          <p className="text-sm font-semibold text-slate-900">{user?.name ?? "Guest"}</p>
          <p className="text-xs text-slate-500">{user?.email ?? ""}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-sm font-bold text-indigo-700 border-2 border-white shadow-sm">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt="Avatar"
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            user?.name?.[0]?.toUpperCase() ?? "?"
          )}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={signOut} 
          className="text-slate-600 hover:text-rose-600 hover:bg-rose-50 flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
