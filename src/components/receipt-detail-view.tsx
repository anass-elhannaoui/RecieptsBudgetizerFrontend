import { Receipt } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "./ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Table, TBody, TD, TH, THead, TR } from "./ui/table";

export function ReceiptDetailView({ receipt }: { receipt: Receipt }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <Card className="h-full p-4">
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
            Receipt image (signed URL)
          </div>
        </Card>
      </div>
      <div className="lg:col-span-3 flex flex-col gap-4">
        <Card className="p-4">
          <CardHeader className="mb-3">
            <div>
              <CardTitle>{receipt.store}</CardTitle>
              <CardDescription>{formatDate(receipt.date)}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={receipt.anomalyFlags.length ? "warning" : "info"}>
                {receipt.anomalyFlags.length ? "Anomaly" : "OK"}
              </Badge>
              <Badge tone="info">{receipt.status}</Badge>
            </div>
          </CardHeader>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex flex-col gap-1 rounded-lg bg-slate-50 p-3">
              <span className="text-xs text-slate-500">Total</span>
              <span className="text-lg font-semibold">{formatCurrency(receipt.total)}</span>
            </div>
            <div className="flex flex-col gap-1 rounded-lg bg-slate-50 p-3">
              <span className="text-xs text-slate-500">Tax</span>
              <span className="text-lg font-semibold">{formatCurrency(receipt.tax)}</span>
            </div>
            <div className="flex flex-col gap-1 rounded-lg bg-slate-50 p-3">
              <span className="text-xs text-slate-500">Category</span>
              <span className="text-base font-semibold capitalize">{receipt.categoryId}</span>
            </div>
            <div className="flex flex-col gap-1 rounded-lg bg-slate-50 p-3">
              <span className="text-xs text-slate-500">OCR confidence</span>
              <span className="text-base font-semibold">{Math.round(receipt.ocrConfidence * 100)}%</span>
            </div>
          </div>
        </Card>

        <Card className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Description</TH>
                <TH className="text-right">Qty</TH>
                <TH className="text-right">Unit</TH>
                <TH className="text-right">Total</TH>
                <TH>Category</TH>
              </TR>
            </THead>
            <TBody>
              {receipt.items.map((item) => (
                <TR key={item.id}>
                  <TD className="font-medium">{item.description}</TD>
                  <TD className="text-right">{item.quantity}</TD>
                  <TD className="text-right">{formatCurrency(item.unitPrice)}</TD>
                  <TD className="text-right font-semibold">{formatCurrency(item.total)}</TD>
                  <TD className="capitalize text-slate-600">{item.categoryId}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>

        <Card className="p-4">
          <CardTitle className="mb-2">Audit</CardTitle>
          <CardDescription className="mb-2">
            OCR confidence {Math.round(receipt.ocrConfidence * 100)}%.
          </CardDescription>
          <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            <pre className="whitespace-pre-wrap text-xs text-slate-700">{receipt.rawText}</pre>
          </div>
        </Card>
      </div>
    </div>
  );
}
