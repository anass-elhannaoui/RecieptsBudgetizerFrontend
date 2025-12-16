"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Wallet, TrendingUp } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { BudgetCard } from "@/components/budget-card";
import { getBudgets, updateBudget, createBudget, getCategories } from "@/lib/api-client";
import { Budget, Category } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export default function BudgetsPage() {
  const [month, setMonth] = useState("2025-12");
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBudget, setNewBudget] = useState({ categoryId: "", limit: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [budgetData, categoryData] = await Promise.all([
          getBudgets(month),
          getCategories(),
        ]);
        setBudgets(budgetData);
        setCategories(categoryData);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [month]);

  const availableCategories = useMemo(() => {
    const budgetCategoryIds = new Set(budgets.map(b => b.categoryId));
    return categories.filter(c => !budgetCategoryIds.has(c.id));
  }, [categories, budgets]);

  const totals = useMemo(() => {
    const spent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const limit = budgets.reduce((sum, b) => sum + b.limit, 0);
    return { spent, limit, remaining: limit - spent };
  }, [budgets]);

  const handleSave = async (id: string, limit: number) => {
    await updateBudget(id, limit);
    setBudgets((prev) => prev.map((b) => (b.id === id ? { ...b, limit } : b)));
  };

  const handleCreate = async () => {
    if (!newBudget.categoryId || !newBudget.limit) {
      return;
    }

    setCreating(true);
    try {
      const budget = await createBudget({
        categoryId: newBudget.categoryId,
        limit: parseFloat(newBudget.limit),
        month: month,
      });
      setBudgets((prev) => [...prev, budget]);
      setNewBudget({ categoryId: "", limit: "" });
      setShowAddForm(false);
    } catch (err) {
      console.error("Failed to create budget:", err);
      alert("Failed to create budget: " + (err as Error).message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (error) {
    const isCategoryError = error.includes("categories") || error.includes("seed-categories");
    return (
      <Alert 
        tone="danger" 
        title="Failed to load budgets" 
        description={
          <>
            {error}
            {isCategoryError && (
              <div className="mt-3 p-3 bg-slate-50 rounded border border-slate-200">
                <p className="text-sm font-medium text-slate-900 mb-1">Quick Fix:</p>
                <code className="text-xs text-slate-700 block">npx tsx seed-categories.ts</code>
              </div>
            )}
          </>
        } 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
              <Wallet className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Budgets</h1>
          </div>
          <p className="text-slate-600 ml-[52px]">Track spending against category budgets.</p>
        </div>
        <Input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <CardTitle className="text-lg">Global budget status</CardTitle>
        </div>
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

      {availableCategories.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <CardTitle className="text-lg">Add New Budget</CardTitle>
              <CardDescription>Create a budget for a category</CardDescription>
            </div>
            {!showAddForm && (
              <Button onClick={() => setShowAddForm(true)} size="sm">
                + Add Budget
              </Button>
            )}
          </div>
          
          {showAddForm && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select
                  label="Category"
                  value={newBudget.categoryId}
                  onChange={(e) => setNewBudget({ ...newBudget, categoryId: e.target.value })}
                >
                  <option value="">Select a category</option>
                  {availableCategories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name} {cat.description && `— ${cat.description}`}
                    </option>
                  ))}
                </Select>
                
                <Input
                  label="Budget Limit"
                  type="number"
                  placeholder="Enter amount"
                  value={newBudget.limit}
                  onChange={(e) => setNewBudget({ ...newBudget, limit: e.target.value })}
                  min="0"
                  step="0.01"
                />
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleCreate} 
                  disabled={!newBudget.categoryId || !newBudget.limit || creating}
                  loading={creating}
                >
                  Create Budget
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => {
                    setShowAddForm(false);
                    setNewBudget({ categoryId: "", limit: "" });
                  }}
                  disabled={creating}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}

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
