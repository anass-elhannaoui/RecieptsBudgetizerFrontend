"use client";

import { useEffect, useState } from "react";
import { Copy, TrendingUp, AlertTriangle, Receipt as ReceiptIcon, Check, Download, BarChart3 } from "lucide-react";
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
      ["Date", "Store", "Total", "Tax", "Anomalies"],
      ...report.receipts.map((r) => [
        formatDate(r.date),
        r.store,
        r.total.toString(),
        r.tax.toString(),
        r.anomalyFlags.length > 0 ? r.anomalyFlags.join("; ") : "None",
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
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Weekly Report</h1>
          </div>
          <p className="text-slate-600 ml-[52px]">
            {formatDate(report.weekStart)} – {formatDate(report.weekEnd)}
          </p>
        </div>
        <Button onClick={handleExport} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
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
              <TH className="text-right">Total</TH>
              <TH className="text-center">Anomalies</TH>
            </TR>
          </THead>
          <TBody>
            {report.receipts.map((r) => (
              <TR key={r.id}>
                <TD>{formatDate(r.date)}</TD>
                <TD className="font-semibold text-slate-900">{r.store}</TD>
                <TD className="text-right font-semibold">{formatCurrency(r.total)}</TD>
                <TD className="text-center">
                  {r.anomalyFlags.length > 0 ? (
                    <div className="flex flex-wrap gap-1 justify-center">
                      {r.anomalyFlags.map((flag) => (
                        <Badge key={flag} tone="warning" className="text-xs flex items-center gap-1">
                          {flag === "duplicate" && <><Copy className="w-3 h-3" /> Duplicate</>}
                          {flag === "spike" && <><TrendingUp className="w-3 h-3" /> Spike</>}
                          {flag === "ocr_mismatch" && <><AlertTriangle className="w-3 h-3" /> Low OCR</>}
                          {flag === "tax_mismatch" && <><ReceiptIcon className="w-3 h-3" /> Tax Issue</>}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <Badge tone="success" className="text-xs flex items-center gap-1 justify-center">
                      <Check className="w-3 h-3" /> OK
                    </Badge>
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
