"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient"; // Direct usage for simplicity
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function RegisterPage() {
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name || !email || !password) {
      setError("All fields are required.");
      return;
    }

    setLoading(true);

    try {
      // 1. Sign up with Supabase
      // We pass 'full_name' in options.data so your SQL trigger can
      // insert it into the 'public.profiles' table.
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            // Add other metadata here if needed (e.g., avatar_url)
          },
        },
      });

      if (signUpError) {
        throw new Error(signUpError.message);
      }

      // 2. Check if session was created immediately
      // If email confirmation is enabled in Supabase (default),
      // data.session might be null until they click the email link.
      // If you disabled email confirmation for dev, they are logged in.
      if (data.session) {
        router.push("/dashboard");
      } else {
        // If email confirmation is required, show a message instead of redirecting
        setError("Registration successful! Please check your email to verify your account.");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md space-y-6 p-6">
        <div className="space-y-2 text-center">
          <CardTitle className="text-2xl">Create an account</CardTitle>
          <CardDescription>Register to start scanning and budgeting.</CardDescription>
        </div>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">Name</label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" loading={loading}>
            Register
          </Button>
        </form>
        {error && <Alert tone={error.includes("successful") ? "success" : "danger"} title="Registration status" description={error} />}
        <p className="text-center text-sm text-slate-600">
          Already have an account? <Link href="/login" className="text-sky-600">Login</Link>
        </p>
      </Card>
    </div>
  );
}
