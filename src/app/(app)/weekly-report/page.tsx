"use client";

import { useEffect, useState } from "react";
import { WeeklyReportSummary } from "@/components/weekly-report-summary";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getWeeklyReport } from "@/lib/api-client";
import { WeeklyReport } from "@/lib/types";
import { downloadCsv, formatCurrency, formatDate } from "@/lib/utils";

export default function WeeklyReportPage() {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getWeeklyReport();
        setReport(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleExport = () => {
    if (!report) return;
    const rows = [
      ["Date", "Store", "Category", "Total", "Tax", "Anomaly"],
      ...report.receipts.map((r) => [
        formatDate(r.date),
        r.store,
        r.categoryId,
        r.total.toString(),
        r.tax.toString(),
        r.anomalyFlags.join(";"),
      ]),
    ];
    downloadCsv("weekly-report.csv", rows);
  };

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (error || !report)
    return <Alert tone="danger" title="Failed to load weekly report" description={error ?? "Unknown error"} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Weekly Report</h1>
          <p className="text-slate-600">
            {formatDate(report.weekStart)} – {formatDate(report.weekEnd)}
          </p>
        </div>
        <Button onClick={handleExport}>Export CSV</Button>
      </div>

      <WeeklyReportSummary report={report} />

      <Card className="p-4">
        <CardTitle className="mb-2 text-lg">Receipts this week</CardTitle>
        <CardDescription className="mb-4">All receipts captured in the selected week.</CardDescription>
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
            {report.receipts.map((r) => (
              <TR key={r.id}>
                <TD>{formatDate(r.date)}</TD>
                <TD className="font-semibold text-slate-900">{r.store}</TD>
                <TD className="capitalize text-slate-600">{r.categoryId}</TD>
                <TD className="text-right font-semibold">{formatCurrency(r.total)}</TD>
                <TD className="text-center">
                  {r.anomalyFlags.length ? (
                    <Badge tone="warning">{r.anomalyFlags.join(", ")}</Badge>
                  ) : (
                    <Badge tone="success">None</Badge>
                  )}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
