import Link from "next/link";
import { Copy, TrendingUp, AlertTriangle, Receipt as ReceiptIcon } from "lucide-react";
import { Receipt } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Card, CardDescription, CardTitle } from "./ui/card";

export function ReceiptCard({ receipt }: { receipt: Receipt }) {
  return (
    <Card className="flex flex-col gap-2 p-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <CardTitle className="text-base truncate">{receipt.store}</CardTitle>
          <CardDescription className="text-xs mt-0.5">{formatDate(receipt.date)}</CardDescription>
        </div>
        <Badge tone={receipt.anomalyFlags.length ? "warning" : "success"} className="shrink-0">
          {receipt.status}
        </Badge>
      </div>
      
      {/* Anomaly indicators */}
      {receipt.anomalyFlags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {receipt.anomalyFlags.map((flag) => (
            <Badge key={flag} tone="warning" className="text-xs flex items-center gap-1">
              {flag === "duplicate" && <><Copy className="w-3 h-3" /> Duplicate</>}
              {flag === "spike" && <><TrendingUp className="w-3 h-3" /> Spike</>}
              {flag === "ocr_mismatch" && <><AlertTriangle className="w-3 h-3" /> Low OCR</>}
              {flag === "tax_mismatch" && <><ReceiptIcon className="w-3 h-3" /> Tax Issue</>}
            </Badge>
          ))}
        </div>
      )}
      
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">Total</span>
        <span className="font-bold text-slate-900">{formatCurrency(receipt.total)}</span>
      </div>
      <Link
        href={`/receipts/${receipt.id}`}
        className="text-xs font-medium text-sky-600 hover:text-sky-700 hover:underline"
      >
        View receipt →
      </Link>
    </Card>
  );
}
