import { supabase } from "@/lib/supabaseClient";
import {
  AuthResult,
  Budget,
  DashboardStats,
  ParsedReceipt,
  Receipt,
  ReceiptItem,
  UploadResult,
  User,
  WeeklyReport,
  Category,
} from "./types";

// Import mocks for the parts we aren't changing yet
import {
  budgets,
  dashboardStats,
  mockUser,
  parsedUploadReceipt,
  receipts as mockReceipts, // renamed to avoid conflict
  weeklyReport,
} from "./mock-data";
import { delay } from "./utils";

const NETWORK_DELAY = 550;

// --- AUTH (Mostly handled by AuthProvider, but keeping for compatibility) ---

export async function login(
  email: string,
  password: string,
): Promise<AuthResult> {
  // Logic is now in AuthProvider, but we keep this signature
  await delay(NETWORK_DELAY);
  return { user: { ...mockUser, email }, token: "mock-token-123" };
}

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<AuthResult> {
  await delay(NETWORK_DELAY);
  return { user: { ...mockUser, name, email }, token: "mock-token-reg" };
}

export async function getCurrentUser(): Promise<User> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    const { full_name, avatar_url } = session.user.user_metadata || {};
    return {
      id: session.user.id,
      email: session.user.email || "",
      name: full_name || "User",
      avatarUrl: avatar_url,
    };
  }
  return mockUser; // Fallback to mock if no real user
}

// --- CORE: SCANNING (REAL FLASK BACKEND) ---

export async function uploadReceipt(
  file: File,
): Promise<UploadResult & { fileName: string; fileSize: number }> {
  
  const formData = new FormData();
  formData.append("file", file);

  try {
    // Call Flask Backend
    const response = await fetch("http://127.0.0.1:5000/api/scan", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Scanning failed on backend");
    }

    const data = await response.json();
    console.log("Backend response:", data);

    // Parse data from raw text if backend doesn't provide structured fields
    const rawText = data.raw_text || "";
    
    // Extract store name (first non-empty line that's not just numbers/symbols)
    let store = "Unknown Store";
    if (data.store && data.store !== "Unknown Store") {
      store = data.store;
    } else if (rawText) {
      const lines = rawText.split('\n').filter(line => line.trim());
      for (let i = 0; i < Math.min(3, lines.length); i++) {
        const line = lines[i].trim();
        // Skip lines that are just numbers, dates, or special characters
        if (line && line.length > 2 && !/^[\d\s:~\-\/]+$/.test(line)) {
          store = line;
          break;
        }
      }
    }
    
    // Extract date (look for MM/DD/YY or MM/DD/YYYY patterns with time)
    // Validate backend date - check if it's a valid date format
    let date = new Date().toISOString().split("T")[0];
    const isValidDate = (dateStr: string) => {
      // Check if it matches YYYY-MM-DD format and is a valid date
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
      const d = new Date(dateStr);
      return d instanceof Date && !isNaN(d.getTime());
    };
    
    if (data.date && isValidDate(data.date)) {
      date = data.date;
    } else if (rawText) {
      // Match date pattern with optional time
      const dateMatch = rawText.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})(?:\s+\d{1,2}:\d{2})?/);
      if (dateMatch) {
        let num1 = parseInt(dateMatch[1]);
        let num2 = parseInt(dateMatch[2]);
        const year = dateMatch[3].length === 2 ? `20${dateMatch[3]}` : dateMatch[3];
        
        // Detect format: if num1 > 12, it must be DD/MM/YYYY, otherwise check if num2 > 12
        let month: string, day: string;
        if (num1 > 12) {
          // DD/MM/YYYY format
          day = num1.toString().padStart(2, '0');
          month = num2.toString().padStart(2, '0');
        } else if (num2 > 12) {
          // MM/DD/YYYY format
          month = num1.toString().padStart(2, '0');
          day = num2.toString().padStart(2, '0');
        } else {
          // Ambiguous - default to DD/MM/YYYY for UK/EU receipts
          day = num1.toString().padStart(2, '0');
          month = num2.toString().padStart(2, '0');
        }
        
        date = `${year}-${month}-${day}`;
      }
    }
    console.log("Parsed date:", date);
    
    // Extract total (look for "Total" first, then "Subtotal")
    let total = data.total || 0;
    if (!total && rawText) {
      // Match Total with currency symbols (£, $, €) - try multiple patterns
      let totalMatch = rawText.match(/Total\s*:?\s*[£$€]\s*([\d,]+\.?\d*)/i);
      if (!totalMatch) {
        totalMatch = rawText.match(/Total\s*:?\s*([\d,]+\.?\d*)/i);
      }
      
      const subtotalMatch = rawText.match(/Subtotal\s*:?\s*[£$€]?\s*([\d,]+\.?\d*)/i);
      
      if (totalMatch) {
        total = parseFloat(totalMatch[1].replace(/,/g, ''));
      } else if (subtotalMatch) {
        total = parseFloat(subtotalMatch[1].replace(/,/g, ''));
      }
      
      console.log("Total extraction:", { totalMatch, subtotalMatch, total });
    }
    
    // Extract tax (look for "Tax", "VAT" but not "Sales Tax" line items)
    let tax = data.tax || 0;
    if (!tax && rawText) {
      // Look for VAT or Tax line
      const vatMatch = rawText.match(/VAT\s+[\d.]+%\s*[£$€]?\s*([\d.]+)/i);
      const taxMatch = rawText.match(/(?:^|\n)Tax\s*:?\s*[£$€]?\s*([\d.]+)/i);
      
      if (vatMatch) {
        tax = parseFloat(vatMatch[1]);
      } else if (taxMatch) {
        tax = parseFloat(taxMatch[1]);
      }
    }
    
    // Parse line items from raw text
    const items: ReceiptItem[] = [];
    if (rawText) {
      const lines = rawText.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Skip headers, totals, and empty lines
        if (!line || /^(Subtotal|Total|VAT|Tax|Receipt|Table)/i.test(line)) {
          continue;
        }
        
        // Pattern 1: "3x Lager £15.75" (quantity x item price)
        let itemMatch = line.match(/^(\d+)x\s+(.+?)\s+[£$€]([\d.]+)$/);
        if (itemMatch) {
          const quantity = parseInt(itemMatch[1]);
          const description = itemMatch[2].trim();
          const totalPrice = parseFloat(itemMatch[3]);
          items.push({
            id: `item-${items.length + 1}`,
            description: description,
            quantity: quantity,
            unitPrice: totalPrice / quantity,
            total: totalPrice,
            categoryId: "uncategorized",
          });
          continue;
        }
        
        // Pattern 2: "Steak & Ale Pie £13.50" (item price)
        itemMatch = line.match(/^(.+?)\s+[£$€]([\d.]+)$/);
        if (itemMatch) {
          const description = itemMatch[1].trim();
          const price = parseFloat(itemMatch[2]);
          // Filter out non-item lines (addresses, times, etc.)
          if (description.length > 2 && !/^[\d:]+$/.test(description) && price > 0) {
            items.push({
              id: `item-${items.length + 1}`,
              description: description,
              quantity: 1,
              unitPrice: price,
              total: price,
              categoryId: "uncategorized",
            });
          }
          continue;
        }
        
        // Pattern 3: "298167 3075C002 1999.99" (item code + price)
        itemMatch = line.match(/^[\d\s]+([\dA-Z]+)\s+([\d.]+)$/);
        if (itemMatch && parseFloat(itemMatch[2]) > 0) {
          // Next line might be the description
          const description = (i + 1 < lines.length) ? lines[i + 1].trim() : itemMatch[1];
          if (description && !/^[\d\s:~\-\/]+$/.test(description)) {
            items.push({
              id: `item-${items.length + 1}`,
              description: description,
              quantity: 1,
              unitPrice: parseFloat(itemMatch[2]),
              total: parseFloat(itemMatch[2]),
              categoryId: "uncategorized",
            });
            i++; // Skip next line since we used it as description
          }
        }
      }
    }

    // Fallback: If total is still 0 but we have items, calculate from items
    if (!total && items.length > 0) {
      const itemsTotal = items.reduce((sum, item) => sum + item.total, 0);
      if (itemsTotal > 0) {
        total = itemsTotal + tax; // Add tax to get final total
        console.log("Calculated total from items:", { itemsTotal, tax, total });
      }
    }

    // Map Backend response to ParsedReceipt
    const receipt: ParsedReceipt = {
      id: `uploaded-${Date.now()}`,
      store: store,
      date: date,
      total: total,
      tax: tax,
      categorySuggestions: data.categories || ["Uncategorized"],
      status: "processed",
      anomalyFlags: [],
      rawText: rawText,
      items: items,
    };

    return {
      receipt,
      fileName: file.name,
      fileSize: file.size,
      message: "Scanned successfully via Tesseract!",
    };
  } catch (error) {
    console.error("Scan error:", error);
    // Fallback to mock if backend is down, so UI doesn't crash during demo
    await delay(NETWORK_DELAY);
    return {
      receipt: { ...parsedUploadReceipt, id: `mock-${Date.now()}` },
      fileName: file.name,
      fileSize: file.size,
      message: "Backend unreachable. Used mock scan.",
    };
  }
}

// --- DATA: RECEIPTS (REAL SUPABASE) ---

export async function getReceipts(): Promise<Receipt[]> {
  try {
    const { data, error } = await supabase
      .from("receipts")
      .select(`
        *,
        categories (name)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return mockReceipts; // Fallback to mock data if DB is empty

    // Map Supabase rows to UI Receipt type
    return data.map((r: any) => ({
      id: r.id,
      store: r.store_name || "Unknown",
      date: r.purchase_date || new Date().toISOString(),
      categoryId: r.categories?.name || r.category_id || "Uncategorized",
      total: Number(r.total_amount) || 0,
      tax: Number(r.tax_amount) || 0,
      status: r.status || "processed",
      anomalyFlags: r.anomalies || [],
      imageUrl: r.image_path,
      ocrConfidence: r.confidence_score || 0,
      rawText: r.ocr_raw_text || "",
      items: [],
    }));
  } catch (err) {
    console.warn("Using mock receipts due to error:", err);
    return mockReceipts;
  }
}

export async function getReceiptById(id: string): Promise<Receipt> {
  try {
    const { data, error } = await supabase
      .from("receipts")
      .select(`*, categories (name)`)
      .eq("id", id)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      store: data.store_name,
      date: data.purchase_date,
      categoryId: data.categories?.name || "Uncategorized",
      total: Number(data.total_amount),
      tax: Number(data.tax_amount),
      status: data.status,
      anomalyFlags: data.anomalies || [],
      imageUrl: data.image_path,
      ocrConfidence: data.confidence_score,
      rawText: data.ocr_raw_text,
      items: [],
    };
  } catch (err) {
    // If not found in DB, check mock data
    const mock = mockReceipts.find((r) => r.id === id);
    if (mock) return mock;
    throw new Error("Receipt not found");
  }
}

// --- DATA: CATEGORIES (REAL SUPABASE) ---

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from("categories").select("*");
  
  if (!error && data && data.length > 0) {
    return data.map((c: any) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
    }));
  }
  
  // Fallback if DB empty
  return [
    { id: "cat-1", name: "Food", icon: "🍔" },
    { id: "cat-2", name: "Transport", icon: "🚗" },
    { id: "cat-3", name: "Tech", icon: "💻" },
  ];
}

// --- MOCKS (For features not yet implemented) ---

export async function getDashboardStats(): Promise<DashboardStats> {
  await delay(NETWORK_DELAY);
  return dashboardStats;
}

export async function getBudgets(month: string): Promise<Budget[]> {
  await delay(NETWORK_DELAY);
  return budgets.filter((b) => b.month === month);
}

export async function updateBudget(
  budgetId: string,
  limit: number,
): Promise<Budget> {
  await delay(NETWORK_DELAY);
  // Just return the mock update
  const budget = budgets.find((b) => b.id === budgetId);
  if (!budget) throw new Error("Budget not found");
  return { ...budget, limit };
}

export async function createBudget(payload: Budget): Promise<Budget> {
  await delay(NETWORK_DELAY);
  return payload;
}

export async function getWeeklyReport(): Promise<WeeklyReport> {
  await delay(NETWORK_DELAY);
  return weeklyReport;
}
