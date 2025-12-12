import { WeeklyReport } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";

export function WeeklyReportSummary({ report }: { report: WeeklyReport }) {
  return (
    <Card className="p-4">
      <CardHeader className="mb-3">
        <div>
          <CardTitle>Weekly Report</CardTitle>
          <CardDescription>
            {formatDate(report.weekStart)} – {formatDate(report.weekEnd)}
          </CardDescription>
        </div>
        <Badge tone="info">{report.receiptCount} receipts</Badge>
      </CardHeader>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 text-sm">
        <StatBlock label="Total spent" value={formatCurrency(report.totalSpent)} />
        <StatBlock label="Anomalies" value={`${report.anomaliesCount}`} tone="warning" />
        <StatBlock label="Average per receipt" value={formatCurrency(report.totalSpent / report.receiptCount)} />
      </div>
      <div className="mt-4 space-y-2">
        {report.highlights.map((h) => (
          <div
            key={h.title}
            className="flex items-start gap-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700"
          >
            <Badge
              tone={h.type === "warning" ? "warning" : h.type === "success" ? "success" : "info"}
              className="flex-shrink-0"
            >
              {h.type}
            </Badge>
            <div>
              <p className="font-semibold text-slate-900">{h.title}</p>
              <p className="text-slate-600">{h.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function StatBlock({ label, value, tone = "info" }: { label: string; value: string; tone?: "info" | "warning" | "success" }) {
  const map: Record<string, string> = {
    info: "bg-sky-50 text-sky-700",
    warning: "bg-amber-50 text-amber-700",
    success: "bg-emerald-50 text-emerald-700",
  };
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${map[tone]}`}>{value}</p>
    </div>
  );
}
