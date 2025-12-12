"use client";

import { useEffect, useMemo, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { BudgetCard } from "@/components/budget-card";
import { getBudgets, updateBudget } from "@/lib/api-client";
import { Budget } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export default function BudgetsPage() {
  const [month, setMonth] = useState("2025-01");
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getBudgets(month);
        setBudgets(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [month]);

  const totals = useMemo(() => {
    const spent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const limit = budgets.reduce((sum, b) => sum + b.limit, 0);
    return { spent, limit, remaining: limit - spent };
  }, [budgets]);

  const handleSave = async (id: string, limit: number) => {
    await updateBudget(id, limit);
    setBudgets((prev) => prev.map((b) => (b.id === id ? { ...b, limit } : b)));
  };

  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (error) {
    return <Alert tone="danger" title="Failed to load budgets" description={error} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Budgets</h1>
          <p className="text-slate-600">Track spending against category budgets.</p>
        </div>
        <Input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <Card className="p-4">
        <CardTitle className="text-lg">Global budget status</CardTitle>
        <CardDescription className="mb-4">Aggregated across all categories for the selected month.</CardDescription>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-sm">
          <Summary label="Total limit" value={formatCurrency(totals.limit)} />
          <Summary label="Total spent" value={formatCurrency(totals.spent)} />
          <Summary
            label="Remaining"
            value={formatCurrency(totals.remaining)}
            tone={totals.remaining < 0 ? "danger" : "success"}
          />
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {budgets.map((b) => (
          <BudgetCard key={b.id} budget={b} onSave={(limit) => handleSave(b.id, limit)} />
        ))}
      </div>
    </div>
  );
}

function Summary({ label, value, tone = "info" }: { label: string; value: string; tone?: "info" | "success" | "danger" }) {
  const map: Record<string, string> = {
    info: "text-slate-700",
    success: "text-emerald-700",
    danger: "text-rose-700",
  };
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${map[tone]}`}>{value}</p>
    </div>
  );
}
