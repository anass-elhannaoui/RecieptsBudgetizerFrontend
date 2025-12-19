"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, DollarSign, PiggyBank, Receipt as ReceiptIcon, AlertCircle, LayoutDashboard } from "lucide-react";
import { SpendingByCategoryChart } from "@/components/spending-by-category-chart";
import { SpendingOverTimeChart } from "@/components/spending-over-time-chart";
import { ReceiptCard } from "@/components/receipt-card";
import { StatWidget } from "@/components/stat-widget";
import { Alert } from "@/components/ui/alert";
import { Card, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getDashboardStats, getReceipts, getSpendingByCategory, getSpendingOverTime, getBudgets } from "@/lib/api-client";
import { DashboardStats, Receipt, Budget } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/auth-provider";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [latest, setLatest] = useState<Receipt[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categoryData, setCategoryData] = useState<Array<{ name: string; value: number; color: string }>>([]);
  const [timeData, setTimeData] = useState<Array<{ date: string; amount: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { signOut } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        // Get current month in YYYY-MM format
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        console.log("Dashboard fetching budgets for month:", currentMonth);
        
        const [s, receipts, catData, tData, budgetData] = await Promise.all([
          getDashboardStats(),
          getReceipts(),
          getSpendingByCategory(),
          getSpendingOverTime(),
          getBudgets(currentMonth),
        ]);
        setStats(s);
        setLatest([...receipts].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 4));
        setCategoryData(catData);
        setTimeData(tData);
        setBudgets(budgetData.sort((a, b) => {
          // Sort by percentage spent (highest first)
          const aPercent = a.limit > 0 ? (a.spent / a.limit) * 100 : 0;
          const bPercent = b.limit > 0 ? (b.spent / b.limit) * 100 : 0;
          return bPercent - aPercent;
        }).slice(0, 4)); // Show top 4 budgets
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="grid gap-6">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !stats) {
    return <Alert tone="danger" title="Failed to load dashboard" description={error ?? "Unknown error"} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-sky-100 text-sky-600">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatWidget 
          label="Total Spent" 
          value={formatCurrency(stats.totalSpentThisMonth)} 
          tone="info" 
          icon={<DollarSign className="w-5 h-5" />}
        />
        <StatWidget 
          label="Remaining Budget" 
          value={formatCurrency(stats.remainingBudget)} 
          tone={stats.remainingBudget < 0 ? "danger" : stats.remainingBudget < 100 ? "warning" : "success"} 
          icon={<PiggyBank className="w-5 h-5" />}
        />
        <StatWidget 
          label="Receipts" 
          value={`${stats.receiptsThisMonth}`} 
          tone="info" 
          icon={<ReceiptIcon className="w-5 h-5" />}
        />
        <StatWidget 
          label="Anomalies" 
          value={`${stats.anomaliesDetected}`} 
          tone={stats.anomaliesDetected > 0 ? "warning" : "success"} 
          icon={<AlertCircle className="w-5 h-5" />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SpendingByCategoryChart data={categoryData} />
        <SpendingOverTimeChart data={timeData} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <CardTitle className="text-lg">Latest receipts</CardTitle>
            <a href="/receipts" className="text-xs text-sky-600 hover:text-sky-700 font-medium hover:underline">
              See all →
            </a>
          </div>
          {latest.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">No receipts yet. Start by scanning your first receipt!</p>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Date</TH>
                  <TH>Store</TH>
                  <TH className="text-right">Total</TH>
                  <TH className="text-center">Status</TH>
                </TR>
              </THead>
              <TBody>
                {latest.map((r) => (
                  <TR key={r.id}>
                    <TD className="whitespace-nowrap text-sm">{formatDate(r.date)}</TD>
                    <TD className="font-medium text-slate-900">{r.store}</TD>
                    <TD className="text-right font-semibold whitespace-nowrap">{formatCurrency(r.total)}</TD>
                    <TD className="text-center">
                      {r.anomalyFlags.length ? (
                        <a 
                          href={`/receipts/${r.id}`}
                          className="inline-block"
                        >
                          <Badge tone="warning" className="cursor-pointer hover:bg-amber-600 transition-colors">
                            Flagged
                          </Badge>
                        </a>
                      ) : (
                        <Badge tone="success">OK</Badge>
                      )}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>

        <Card className="p-4">
          <CardTitle className="mb-3 text-lg">Budget alerts</CardTitle>
          {budgets.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-slate-500">No budgets set.</p>
              <a href="/budgets" className="text-sm text-sky-600 hover:underline font-medium">Create your first budget →</a>
            </div>
          ) : budgets.every(b => (b.spent / b.limit) * 100 < 80) ? (
            <div className="py-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-3">
                <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-900">All budgets healthy!</p>
              <p className="text-xs text-slate-500 mt-1">All categories are under 80% of budget</p>
            </div>
          ) : (
            <div className="space-y-3">
              {budgets.map((budget) => {
                const percentage = budget.limit > 0 ? (budget.spent / budget.limit) * 100 : 0;
                const isOverBudget = percentage >= 100;
                const isNearLimit = percentage >= 80 && percentage < 100;
                
                return (
                  <div key={budget.id} className="border border-slate-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{budget.categoryName}</h4>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {formatCurrency(budget.spent)} of {formatCurrency(budget.limit)}
                        </p>
                      </div>
                      <Badge 
                        tone={isOverBudget ? "danger" : isNearLimit ? "warning" : "success"}
                        className="shrink-0 ml-2"
                      >
                        {percentage.toFixed(0)}%
                      </Badge>
                    </div>
                    
                    <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`absolute inset-y-0 left-0 rounded-full transition-all ${
                          isOverBudget 
                            ? "bg-rose-500" 
                            : isNearLimit 
                              ? "bg-amber-500" 
                              : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                    
                    {isOverBudget && (
                      <p className="text-xs text-rose-600 font-medium mt-2 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Over budget by {formatCurrency(budget.spent - budget.limit)}
                      </p>
                    )}
                    {isNearLimit && !isOverBudget && (
                      <p className="text-xs text-amber-600 font-medium mt-2">
                        {formatCurrency(budget.limit - budget.spent)} remaining
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
