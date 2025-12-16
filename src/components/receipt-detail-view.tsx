import { Receipt, Category, AnomalyFlag } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Copy, TrendingUp, AlertTriangle, Receipt as ReceiptIcon, AlertOctagon, DollarSign, FileText, ShoppingCart, Eye } from "lucide-react";
import { Badge } from "./ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Table, TBody, TD, TH, THead, TR } from "./ui/table";
import { useEffect, useState } from "react";
import { getCategories } from "@/lib/api-client";
import { Alert } from "./ui/alert";

export function ReceiptDetailView({ receipt }: { receipt: Receipt }) {
  const [categories, setCategories] = useState<Category[]>([]);
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const cats = await getCategories();
        setCategories(cats);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : categoryId;
  };

  const getAnomalyDetails = (flag: AnomalyFlag) => {
    switch (flag) {
      case "duplicate":
        return { icon: Copy, title: "Duplicate Receipt", description: "This receipt may be a duplicate (same store, date, and amount as another receipt)" };
      case "spike":
        return { icon: TrendingUp, title: "Spending Spike", description: "This amount is significantly higher than your usual spending (3x your average)" };
      case "ocr_mismatch":
        return { icon: AlertTriangle, title: "Low OCR Confidence", description: "The text recognition confidence is below 70% - please verify the details" };
      case "tax_mismatch":
        return { icon: ReceiptIcon, title: "Unusual Tax Rate", description: "The tax rate appears unusual (outside the 5-30% range)" };
      default:
        return { icon: AlertTriangle, title: flag, description: "Unknown anomaly type" };
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <Card className="h-full p-4">
          {receipt.imageUrl ? (
            <img
              src={receipt.imageUrl}
              alt={`Receipt from ${receipt.store}`}
              className="h-full w-full rounded-lg object-contain"
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">
              No image available
            </div>
          )}
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
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
              <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                <DollarSign className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-500">Total</span>
                <span className="text-lg font-semibold">{formatCurrency(receipt.total)}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
              <div className="p-2 rounded-lg bg-slate-200 text-slate-700">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-500">Tax</span>
                <span className="text-lg font-semibold">{formatCurrency(receipt.tax)}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
              <div className="p-2 rounded-lg bg-violet-100 text-violet-600">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-500">Items</span>
                <span className="text-lg font-semibold">{receipt.items.length}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-600">
                <Eye className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-slate-500">OCR confidence</span>
                <span className="text-base font-semibold">{Math.round(receipt.ocrConfidence * 100)}%</span>
              </div>
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
                  <TD className="capitalize text-slate-600">{getCategoryName(item.categoryId)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>

        {receipt.anomalyFlags.length > 0 && (
          <Card className="p-4">
            <CardTitle className="mb-3 flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-rose-600" />
              Anomalies Detected
            </CardTitle>
            <div className="space-y-3">
              {receipt.anomalyFlags.map((flag, index) => {
                const details = getAnomalyDetails(flag);
                const IconComponent = details.icon;
                return (
                  <Alert 
                    key={index}
                    tone="warning"
                    title={
                      <span className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4" />
                        {details.title}
                      </span>
                    }
                    description={details.description}
                  />
                );
              })}
            </div>
          </Card>
        )}

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
