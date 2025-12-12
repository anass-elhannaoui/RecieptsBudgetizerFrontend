"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabaseClient";
import { Session, User as SupabaseUser } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

// Define your app's User type matching your interface
export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Helper to map Supabase user to your app's User type
const mapUser = (sbUser: SupabaseUser): User => {
  const { full_name, avatar_url } = sbUser.user_metadata || {};
  return {
    id: sbUser.id,
    email: sbUser.email || "",
    name: full_name || sbUser.email?.split("@")[0] || "User",
    avatarUrl: avatar_url,
  };
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ? mapUser(session.user) : null);
      setLoading(false);
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ? mapUser(session.user) : null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
