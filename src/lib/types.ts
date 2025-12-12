export type AnomalyFlag = "duplicate" | "spike" | "ocr_mismatch" | "tax_mismatch";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export type ReceiptStatus = "processed" | "pending" | "flagged";

export interface ReceiptItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  categoryId: string;
}

export interface Receipt {
  id: string;
  store: string;
  date: string;
  categoryId: string;
  total: number;
  tax: number;
  status: ReceiptStatus;
  anomalyFlags: AnomalyFlag[];
  imageUrl?: string;
  ocrConfidence: number;
  rawText: string;
  items: ReceiptItem[];
}

export interface DashboardCategoryStat {
  categoryId: string;
  categoryName: string;
  amount: number;
}

export interface DashboardTimePoint {
  date: string;
  amount: number;
}

export interface DashboardStats {
  totalSpentThisMonth: number;
  remainingBudget: number;
  receiptsThisMonth: number;
  anomaliesDetected: number;
  spendingByCategory: DashboardCategoryStat[];
  spendingOverTime: DashboardTimePoint[];
}

export interface Budget {
  id: string;
  categoryId: string;
  categoryName: string;
  limit: number;
  spent: number;
  month: string; // YYYY-MM
}

export interface WeeklyHighlight {
  title: string;
  description: string;
  type: "info" | "warning" | "success";
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  totalSpent: number;
  receiptCount: number;
  anomaliesCount: number;
  highlights: WeeklyHighlight[];
  receipts: Receipt[];
}

export interface ParsedReceipt {
  id: string;
  store: string;
  date: string;
  total: number;
  tax: number;
  categorySuggestions: string[];
  status: ReceiptStatus;
  anomalyFlags: AnomalyFlag[];
  rawText: string;
  items: ReceiptItem[];
}

export interface UploadResult {
  receipt: ParsedReceipt;
  message: string;
}

export interface AuthResult {
  user: User;
  token: string;
}
