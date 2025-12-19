import { Receipt, Category, AnomalyFlag, AIValidationFlag } from "@/lib/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Copy, TrendingUp, AlertTriangle, Receipt as ReceiptIcon, AlertOctagon, DollarSign, FileText, ShoppingCart, Eye, Bot, AlertCircle } from "lucide-react";
import { Badge } from "./ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Table, TBody, TD, TH, THead, TR } from "./ui/table";
import { useEffect, useState } from "react";
import { getCategories } from "@/lib/api-client";
import { Alert } from "./ui/alert";
import { BoundingBoxCanvas } from "./bounding-box-canvas";

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

  const getAIValidationDetails = (flag: AIValidationFlag) => {
    switch (flag) {
      case "price_suspicious":
        return { icon: DollarSign, title: "Suspicious Price", description: "The price appears unusual (zero, negative, or extremely high)" };
      case "quantity_unusual":
        return { icon: ShoppingCart, title: "Unusual Quantity", description: "The quantity is outside normal range (zero, negative, or extremely high)" };
      case "description_unclear":
        return { icon: FileText, title: "Unclear Description", description: "The item description is too short, unclear, or may be a placeholder" };
      case "category_mismatch":
        return { icon: AlertTriangle, title: "Category Mismatch", description: "The assigned category may not match the item description" };
      case "total_calculation_error":
        return { icon: AlertCircle, title: "Calculation Error", description: "The item total doesn't match quantity × unit price" };
      default:
        return { icon: AlertTriangle, title: flag, description: "Unknown validation issue" };
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <Card className="h-full p-4">
          {receipt.imageUrl ? (
            receipt.ocr_data && receipt.ocr_data.length > 0 ? (
              <BoundingBoxCanvas
                imageUrl={receipt.imageUrl}
                ocrData={receipt.ocr_data}
                className="h-full"
              />
            ) : (
              <img
                src={receipt.imageUrl}
                alt="Receipt"
                className="h-full w-full rounded-lg object-contain"
              />
            )
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
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-slate-700" />
              Line Items ({receipt.items.length})
            </CardTitle>
          </div>
          <Table>
            <THead>
              <TR>
                <TH>Description</TH>
                <TH className="text-right">Qty</TH>
                <TH className="text-right">Unit</TH>
                <TH className="text-right">Total</TH>
                <TH>Category</TH>
                <TH className="text-center">AI Status</TH>
              </TR>
            </THead>
            <TBody>
              {receipt.items.map((item) => {
                const hasIssues = item.aiValidationFlags && item.aiValidationFlags.length > 0;
                const lowConfidence = item.aiConfidence !== undefined && item.aiConfidence < 0.7;
                
                return (
                  <TR key={item.id} className={hasIssues || lowConfidence ? 'bg-amber-50/50' : ''}>
                    <TD className="font-medium">
                      <div>
                        {item.description}
                        {hasIssues && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.aiValidationFlags?.map((flag, idx) => (
                              <Badge key={idx} tone="warning" className="text-xs">
                                {flag.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </TD>
                    <TD className="text-right">{item.quantity}</TD>
                    <TD className="text-right">{formatCurrency(item.unitPrice)}</TD>
                    <TD className="text-right font-semibold">{formatCurrency(item.total)}</TD>
                    <TD className="capitalize text-slate-600">{getCategoryName(item.categoryId)}</TD>
                    <TD className="text-center">
                      {hasIssues || lowConfidence ? (
                        <div className="flex flex-col items-center gap-1">
                          <Badge tone="warning" className="text-xs">
                            <Bot className="w-3 h-3 mr-1" />
                            Needs Review
                          </Badge>
                          {item.aiConfidence !== undefined && (
                            <span className="text-xs text-slate-600">
                              {Math.round(item.aiConfidence * 100)}%
                            </span>
                          )}
                        </div>
                      ) : (
                        <Badge tone="success" className="text-xs">
                          <Bot className="w-3 h-3 mr-1" />
                          OK
                        </Badge>
                      )}
                    </TD>
                  </TR>
                );
              })}
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

        {receipt.items.some(item => item.aiValidationFlags && item.aiValidationFlags.length > 0) && (
          <Card className="p-4 border-2 border-amber-200 bg-amber-50/30">
            <div className="flex items-start justify-between mb-4">
              <div>
                <CardTitle className="mb-2 flex items-center gap-2 text-amber-900">
                  <Bot className="w-5 h-5" />
                  Items Requiring Attention
                </CardTitle>
                <CardDescription className="text-amber-800">
                  AI detected {receipt.items.filter(item => item.aiValidationFlags && item.aiValidationFlags.length > 0).length} item(s) with potential issues. Please review and take action.
                </CardDescription>
              </div>
              <Badge tone="warning" className="shrink-0">
                Action Required
              </Badge>
            </div>
            <div className="space-y-4">
              {receipt.items.filter(item => item.aiValidationFlags && item.aiValidationFlags.length > 0).map((item) => (
                <div key={item.id} className="bg-white border-2 border-amber-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-bold text-slate-900 text-lg">{item.description}</h4>
                      <div className="mt-1 flex items-center gap-4 text-sm text-slate-600">
                        <span>Qty: <span className="font-semibold">{item.quantity}</span></span>
                        <span>×</span>
                        <span>Unit: <span className="font-semibold">{formatCurrency(item.unitPrice)}</span></span>
                        <span>=</span>
                        <span>Total: <span className="font-semibold text-lg">{formatCurrency(item.total)}</span></span>
                      </div>
                    </div>
                    {item.aiConfidence !== undefined && (
                      <div className="flex flex-col items-end gap-1 ml-4">
                        <span className="text-xs text-slate-500 uppercase tracking-wide">Confidence</span>
                        <Badge 
                          tone={item.aiConfidence > 0.8 ? "success" : item.aiConfidence > 0.5 ? "warning" : "danger"}
                          className="text-base font-bold px-3 py-1"
                        >
                          {Math.round(item.aiConfidence * 100)}%
                        </Badge>
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t border-amber-200 pt-3 mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-semibold text-amber-900 uppercase tracking-wide">Detected Issues</span>
                    </div>
                    <div className="space-y-2">
                      {item.aiValidationFlags?.map((flag, idx) => {
                        const details = getAIValidationDetails(flag);
                        const IconComponent = details.icon;
                        return (
                          <div key={idx} className="flex items-start gap-3 bg-amber-50 rounded p-3 border border-amber-200">
                            <div className="shrink-0 p-2 bg-amber-100 rounded-lg">
                              <IconComponent className="w-5 h-5 text-amber-700" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-slate-900 mb-1">{details.title}</p>
                              <p className="text-sm text-slate-700">{details.description}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t border-amber-200 pt-3 mt-3">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-semibold text-amber-900 uppercase tracking-wide">Recommended Actions</span>
                    </div>
                    <ul className="space-y-1.5 text-sm text-slate-700">
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>Verify the extracted values against the receipt image</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>Correct any incorrect quantities, prices, or descriptions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>Update the category if it doesn't match the item type</span>
                      </li>
                      {item.aiConfidence && item.aiConfidence < 0.5 && (
                        <li className="flex items-start gap-2">
                          <span className="text-red-600 font-bold">•</span>
                          <span className="font-semibold text-red-700">Low confidence - manual verification strongly recommended</span>
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              ))}
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
