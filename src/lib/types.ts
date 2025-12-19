export type AnomalyFlag = "duplicate" | "spike" | "ocr_mismatch" | "tax_mismatch";

// AI validation flags for extracted items
export type AIValidationFlag = 
  | "price_suspicious" 
  | "quantity_unusual" 
  | "description_unclear" 
  | "category_mismatch"
  | "total_calculation_error";

// PaddleOCR bounding box structure
export interface BoundingBox {
  top_left: [number, number];      // [x, y]
  top_right: [number, number];     // [x, y]
  bottom_right: [number, number];  // [x, y]
  bottom_left: [number, number];   // [x, y]
}

// OCR data for each detected text region
export interface OcrData {
  text: string;              // Detected text
  confidence: number;        // 0-1 (e.g., 0.982 = 98.2%)
  bounding_box: BoundingBox; // Coordinates for drawing boxes
}

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
  description?: string;
}

export type ReceiptStatus = "processed" | "pending" | "flagged";

export interface ReceiptItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  categoryId: string;
  aiValidationFlags?: AIValidationFlag[]; // AI-detected issues with extracted data
  aiConfidence?: number; // Confidence score for this specific item (0-1)
}

export interface Receipt {
  id: string;
  store: string;
  date: string;
  categoryId: string; // DEPRECATED: Receipts don't have categories. This field exists only for backwards compatibility. Use item.categoryId instead.
  total: number;
  tax: number;
  status: ReceiptStatus;
  anomalyFlags: AnomalyFlag[];
  imageUrl?: string;
  ocrConfidence: number;
  rawText: string;
  items: ReceiptItem[];
  ocr_data?: OcrData[]; // PaddleOCR detection results with bounding boxes
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
  confidence?: number;
  items: ReceiptItem[];
  ocr_data?: OcrData[]; // PaddleOCR bounding box data
}

export interface UploadResult {
  receipt: ParsedReceipt;
  message: string;
}

export interface AuthResult {
  user: User;
  token: string;
}
