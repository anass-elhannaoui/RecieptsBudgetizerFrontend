"use client";

import { AuthProvider } from "./auth-provider";
import { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
