"use client";

import { useEffect, useState } from "react";
import { ChartPlaceholder } from "@/components/chart-placeholder";
import { ReceiptCard } from "@/components/receipt-card";
import { StatWidget } from "@/components/stat-widget";
import { Alert } from "@/components/ui/alert";
import { Card, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getDashboardStats, getReceipts } from "@/lib/api-client";
import { DashboardStats, Receipt } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/auth-provider";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [latest, setLatest] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { signOut } = useAuth();

  useEffect(() => {
    const load = async () => {
      try {
        const [s, receipts] = await Promise.all([getDashboardStats(), getReceipts()]);
        setStats(s);
        setLatest([...receipts].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5));
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
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatWidget label="Total spent this month" value={formatCurrency(stats.totalSpentThisMonth)} tone="info" />
        <StatWidget label="Remaining budget" value={formatCurrency(stats.remainingBudget)} tone="success" />
        <StatWidget label="Receipts this month" value={`${stats.receiptsThisMonth}`} tone="info" />
        <StatWidget label="Anomalies detected" value={`${stats.anomaliesDetected}`} tone="warning" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPlaceholder
          title="Spending by category"
          description="Categories with total spend"
        />
        <ChartPlaceholder title="Spending over time" description="Daily spend trend" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <CardTitle className="mb-3 text-lg">Latest receipts</CardTitle>
          <Table>
            <THead>
              <TR>
                <TH>Date</TH>
                <TH>Store</TH>
                <TH>Category</TH>
                <TH className="text-right">Total</TH>
                <TH className="text-center">Anomaly</TH>
              </TR>
            </THead>
            <TBody>
              {latest.map((r) => (
                <TR key={r.id}>
                  <TD>{formatDate(r.date)}</TD>
                  <TD className="font-semibold text-slate-900">{r.store}</TD>
                  <TD className="capitalize text-slate-600">{r.categoryId}</TD>
                  <TD className="text-right font-semibold">{formatCurrency(r.total)}</TD>
                  <TD className="text-center">
                    {r.anomalyFlags.length ? (
                      <Badge tone="warning">Yes</Badge>
                    ) : (
                      <Badge tone="success">No</Badge>
                    )}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>

        <div className="space-y-3">
          {latest.map((r) => (
            <ReceiptCard key={r.id} receipt={r} />
          ))}
        </div>
      </div>
    </div>
  );
}
