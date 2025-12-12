import Link from "next/link";
import { Receipt } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Card, CardDescription, CardTitle } from "./ui/card";

export function ReceiptCard({ receipt }: { receipt: Receipt }) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <CardTitle className="text-lg">{receipt.store}</CardTitle>
        <Badge tone={receipt.anomalyFlags.length ? "warning" : "default"}>
          {receipt.anomalyFlags.length ? "Anomaly" : receipt.status}
        </Badge>
      </div>
      <CardDescription>{formatDate(receipt.date)}</CardDescription>
      <div className="flex items-center justify-between text-sm font-semibold text-slate-900">
        <span>Total</span>
        <span>{formatCurrency(receipt.total)}</span>
      </div>
      <Link
        href={`/receipts/${receipt.id}`}
        className="text-sm font-semibold text-sky-600 hover:text-sky-700"
      >
        View receipt →
      </Link>
    </Card>
  );
}
