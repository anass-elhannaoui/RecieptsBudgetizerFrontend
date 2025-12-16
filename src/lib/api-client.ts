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
  WeeklyHighlight,
  Category,
  AnomalyFlag,
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
  throw new Error("Not authenticated");
}

// --- CORE: SCANNING (REAL FLASK BACKEND) ---

// Upload with OpenAI parsing
export async function uploadReceiptWithAI(
  file: File,
): Promise<UploadResult & { fileName: string; fileSize: number }> {
  
  const formData = new FormData();
  formData.append("file", file);

  try {
    // Step 1: Fetch all categories from database to create mapping
    const categories = await getCategories();
    const categoryNameToId: Record<string, string> = {};
    let uncategorizedId = "";
    
    categories.forEach(cat => {
      categoryNameToId[cat.name] = cat.id;
      if (cat.name === "Uncategorized") {
        uncategorizedId = cat.id;
      }
    });

    console.log("Category mapping:", categoryNameToId);

    // Step 2: Call Flask Backend for AI-powered OCR and parsing
    const response = await fetch("http://127.0.0.1:5000/api/scan-ai", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      
      // Handle specific error cases from backend
      if (response.status === 400) {
        // Low confidence or unreadable image
        throw new Error(errorData.error || errorData.message || "Image quality too poor for AI parsing");
      }
      
      throw new Error(errorData.error || errorData.message || "AI scanning failed on backend");
    }

    const data = await response.json();
    
    // Check if AI flagged the content as unreadable
    if (data.error === "unreadable" || data.message?.includes("unreadable")) {
      throw new Error("Receipt text is unreadable. Please upload a clearer image with better lighting.");
    }
    
    console.log("AI Backend response:", data);
    console.log("AI raw_text:", data.raw_text ? `${data.raw_text.length} chars` : "MISSING");
    console.log("AI confidence:", data.confidence);
    
    // Validate minimum required fields
    if (!data.store && !data.total && (!data.items || data.items.length === 0)) {
      throw new Error("Unable to extract receipt data. Please ensure the image is clear and try again.");
    }

    // Step 3: Transform items - replace category name with categoryId UUID
    const transformedItems = (data.items || []).map((item: any, index: number) => {
      const categoryName = item.category || "Uncategorized";
      const categoryId = categoryNameToId[categoryName] || uncategorizedId;
      
      console.log(`Item ${index + 1}: "${item.description}" - Category "${categoryName}" → UUID ${categoryId}`);
      
      return {
        id: item.id || `item-${Date.now()}-${index}`,
        description: item.description || "Unknown Item",
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        total: item.total || 0,
        categoryId: categoryId, // This is now a UUID from database
      };
    });

    // Step 4: Create receipt object with transformed items
    const receipt: ParsedReceipt = {
      id: `temp-${Date.now()}`,
      store: data.store || "Unknown Store",
      date: data.date || new Date().toISOString().split("T")[0],
      total: data.total || 0,
      tax: data.tax || 0,
      items: transformedItems,
      rawText: data.raw_text || "",
      confidence: data.confidence,
      categorySuggestions: data.categories || ["Uncategorized"],
      status: "processed",
      anomalyFlags: [],
    };

    console.log(`✅ AI parsing complete: ${data.store} - $${data.total} (${transformedItems.length} items)`);

    return {
      receipt,
      message: `AI parsing successful: ${data.store} - $${data.total}`,
      fileName: file.name,
      fileSize: file.size,
    };
  } catch (err) {
    console.error("AI scanning error:", err);
    throw new Error("Failed to parse receipt with AI: " + (err as Error).message);
  }
}

// Upload with regex parsing (original method)
export async function uploadReceipt(
  file: File,
): Promise<UploadResult & { fileName: string; fileSize: number }> {
  
  const formData = new FormData();
  formData.append("file", file);

  try {
    // Call Flask Backend for OCR only
    const response = await fetch("http://127.0.0.1:5000/api/scan", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Scanning failed on backend");
    }

    const data = await response.json();
    console.log("Regex Backend response:", data);
    console.log("Regex raw_text:", data.raw_text ? `${data.raw_text.length} chars` : "MISSING");
    console.log("Regex confidence:", data.confidence);

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
      // Malaysian format: TOT' : RM 278.80 or Total : RM 278.80
      let totalMatch = rawText.match(/TOT['']?\s*:?\s*RM\s*([\d,]+\.?\d*)/i);
      if (!totalMatch) {
        totalMatch = rawText.match(/Total\s*:?\s*RM\s*([\d,]+\.?\d*)/i);
      }
      if (!totalMatch) {
        totalMatch = rawText.match(/Total\s*:?\s*[£$€]\s*([\d,]+\.?\d*)/i);
      }
      if (!totalMatch) {
        totalMatch = rawText.match(/Total\s*:?\s*([\d,]+\.?\d*)/i);
      }
      
      const subtotalMatch = rawText.match(/Sub\s*Total\s*:?\s*RM\s*([\d,]+\.?\d*)/i);
      
      if (totalMatch) {
        total = parseFloat(totalMatch[1].replace(/,/g, '').replace(/\s/g, ''));
      } else if (subtotalMatch) {
        total = parseFloat(subtotalMatch[1].replace(/,/g, '').replace(/\s/g, ''));
      }
      
      console.log("Total extraction:", { totalMatch, subtotalMatch, total });
    }
    
    // Extract tax (look for "Tax", "VAT", "GST" but not "Sales Tax" line items)
    let tax = data.tax || 0;
    if (!tax && rawText) {
      // Malaysian format: GST/TAX 6% : RM 15.78
      let taxMatch = rawText.match(/GST\/TAX\s+[\d.]+%\s*:?\s*RM\s*([\d,]+\.?\d*)/i);
      if (!taxMatch) {
        taxMatch = rawText.match(/GST\s*:?\s*RM\s*([\d,]+\.?\d*)/i);
      }
      if (!taxMatch) {
        taxMatch = rawText.match(/VAT\s+[\d.]+%\s*[£$€RM]?\s*([\d,]+\.?\d*)/i);
      }
      if (!taxMatch) {
        taxMatch = rawText.match(/(?:^|\n)Tax\s*:?\s*[£$€RM]?\s*([\d,]+\.?\d*)/i);
      }
      
      if (taxMatch) {
        tax = parseFloat(taxMatch[1].replace(/,/g, '').replace(/\s/g, ''));
      }
    }
    
    // Parse line items from raw text with multiple pattern support
    const items: ReceiptItem[] = [];
    if (rawText) {
      const lines = rawText.split('\n');
      let skipNext = false;
      
      // Helper function to check if line is likely NOT a product item
      const isNotProductLine = (text: string): boolean => {
        const lowerText = text.toLowerCase();
        
        // Skip header/footer text
        if (/^(subtotal|sub total|total|tot['\s]|vat|gst|tax|receipt|table|item count|qty count|closed bill|bill date|cashier|station|change|cash|payment|tender|paid|thank|address|code|name|customer)/i.test(text)) {
          return true;
        }
        
        // Skip company/contact info
        if (/^(tel|fax|phone|email|website|www\.|http|gst no|gst id|roc no|reg no|company no|ssm|bank acc|account|sort code)[\s:]/i.test(text)) {
          return true;
        }
        
        // Skip addresses (contains street keywords)
        if (/(jalan|street|road|avenue|ave|lane|drive|blvd|plaza|square|bandar|taman|persiaran|lorong|no\.\s*\d+|^no:|^\d+[,\s]+[a-z]+\s+[a-z]+)/i.test(text)) {
          return true;
        }
        
        // Skip city/postal codes
        if (/\d{5}|\bselangor\b|\bkuala lumpur\b|\bmalaysia\b|\bcity\b|\bstate\b|\bzip\b|\bpostal\b/i.test(lowerText)) {
          return true;
        }
        
        // Skip rounding/adjustment lines
        if (/round|adjust|discount|service charge|tips?|gratuity/i.test(lowerText)) {
          return true;
        }
        
        // Skip lines that are just numbers/codes (like "007", "123456")
        if (/^\d+$/.test(text.trim())) {
          return true;
        }
        
        return false;
      };
      
      for (let i = 0; i < lines.length; i++) {
        if (skipNext) {
          skipNext = false;
          continue;
        }
        
        const line = lines[i].trim();
        
        // Skip empty lines
        if (!line) {
          continue;
        }
        
        // Skip non-product lines
        if (isNotProductLine(line)) {
          continue;
        }
        
        let matched = false;
        
        // Pattern 1: Malaysian format with description on previous line
        // "-2  * RM 45.29 UNI ( 5.43)=RM 90. 57" with description above
        let itemMatch = line.match(/^[-]?(\d+)\s*\*\s*(?:RM|rm|Rs|rs|€|£|\$)?\s*([\d,.]+).*?=\s*(?:RM|rm|Rs|rs|€|£|\$)?\s*([\d,.]+)/i);
        if (itemMatch && i > 0) {
          const quantity = Math.abs(parseInt(itemMatch[1]));
          const unitPrice = parseFloat(itemMatch[2].replace(/,/g, '').replace(/\s/g, ''));
          const totalPrice = parseFloat(itemMatch[3].replace(/,/g, '').replace(/\s/g, ''));
          
          // Look for description in previous lines (up to 2 lines back)
          let description = "Unknown Item";
          for (let j = i - 1; j >= Math.max(0, i - 2); j--) {
            const prevLine = lines[j].trim();
            if (prevLine && prevLine.length > 2 && !isNotProductLine(prevLine) && !/^[\d\s:~\-\/\*=]+$/.test(prevLine)) {
              description = prevLine;
              break;
            }
          }
          
          items.push({
            id: `item-${items.length + 1}`,
            description: description,
            quantity: quantity,
            unitPrice: unitPrice,
            total: totalPrice,
            categoryId: "uncategorized",
          });
          matched = true;
        }
        
        // Pattern 2: "3x Lager £15.75" or "2 x Burger $24.50"
        if (!matched) {
          itemMatch = line.match(/^[-]?(\d+)\s*x\s+(.+?)\s+(?:RM|rm|Rs|rs|€|£|\$)\s*([\d,.]+)$/i);
          if (itemMatch) {
            const quantity = Math.abs(parseInt(itemMatch[1]));
            const description = itemMatch[2].trim();
            const totalPrice = parseFloat(itemMatch[3].replace(/,/g, '').replace(/\s/g, ''));
            
            if (!isNotProductLine(description)) {
              items.push({
                id: `item-${items.length + 1}`,
                description: description,
                quantity: quantity,
                unitPrice: totalPrice / quantity,
                total: totalPrice,
                categoryId: "uncategorized",
              });
              matched = true;
            }
          }
        }
        
        // Pattern 3: "Steak & Ale Pie £13.50" or "Coffee RM 5.50"
        if (!matched) {
          itemMatch = line.match(/^(.+?)\s+(?:RM|rm|Rs|rs|€|£|\$)\s*([\d,.]+)$/i);
          if (itemMatch) {
            const description = itemMatch[1].trim();
            const price = parseFloat(itemMatch[2].replace(/,/g, '').replace(/\s/g, ''));
            // Filter out non-item lines
            if (description.length > 2 && !/^[\d:]+$/.test(description) && price > 0 && !isNotProductLine(description)) {
              items.push({
                id: `item-${items.length + 1}`,
                description: description,
                quantity: 1,
                unitPrice: price,
                total: price,
                categoryId: "uncategorized",
              });
              matched = true;
            }
          }
        }
        
        // Pattern 4: Quantity at start, description, then price at end (space-separated)
        // "2 Pizza Margherita 18.50"
        if (!matched) {
          itemMatch = line.match(/^(\d+)\s+(.+?)\s+([\d,.]+)$/);
          if (itemMatch) {
            const quantity = parseInt(itemMatch[1]);
            const description = itemMatch[2].trim();
            const price = parseFloat(itemMatch[3].replace(/,/g, ''));
            if (description.length > 2 && price > 0 && !isNotProductLine(description)) {
              items.push({
                id: `item-${items.length + 1}`,
                description: description,
                quantity: quantity,
                unitPrice: price / quantity,
                total: price,
                categoryId: "uncategorized",
              });
              matched = true;
            }
          }
        }
        
        // Pattern 5: Item code on current line, description on next line, price pattern
        // "YT51129 SR" followed by "YE36 BK 12W" (partial match - already handled by Pattern 1)
        
        // Pattern 6: Generic pattern - any line ending with a reasonable price (DISABLED - too risky)
        // This pattern causes too many false positives with addresses and phone numbers
        /*
        if (!matched && i + 1 < lines.length) {
          itemMatch = line.match(/([\d,.]+)$/);
          if (itemMatch) {
            const price = parseFloat(itemMatch[1].replace(/,/g, ''));
            // Check if price is reasonable (not a phone number, date, etc.)
            if (price > 0 && price < 10000 && line.length > 5 && !/^\d+$/.test(line)) {
              const description = line.replace(/([\d,.]+)$/, '').trim();
              if (description.length > 2 && !isNotProductLine(description)) {
                items.push({
                  id: `item-${items.length + 1}`,
                  description: description || "Unknown Item",
                  quantity: 1,
                  unitPrice: price,
                  total: price,
                  categoryId: "uncategorized",
                });
                matched = true;
              }
            }
          }
        }
        */
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

    // Return parsed receipt WITHOUT saving to database
    const receipt: ParsedReceipt = {
      id: `temp-${Date.now()}`,
      store: store,
      date: date,
      total: total,
      tax: tax,
      categorySuggestions: data.categories || ["Uncategorized"],
      status: "processed",
      anomalyFlags: [],
      rawText: rawText,
      confidence: data.confidence,
      items: items,
    };

    return {
      receipt,
      fileName: file.name,
      fileSize: file.size,
      message: "Receipt scanned successfully! Review and click 'Save to Database' to save.",
    };
  } catch (error) {
    console.error("Scan error:", error);
    // Fallback to mock if backend is down
    await delay(NETWORK_DELAY);
    return {
      receipt: { ...parsedUploadReceipt, id: `mock-${Date.now()}` },
      fileName: file.name,
      fileSize: file.size,
      message: "Backend unreachable. Used mock scan.",
    };
  }
}

// --- SAVE RECEIPT TO DATABASE ---

export async function saveReceiptToDatabase(
  receipt: ParsedReceipt,
  imageFile: File
): Promise<{ success: boolean; receiptId?: string; receipt?: ParsedReceipt; message: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Check if this is an existing receipt (has a real UUID, not temp-xxx)
    const isExistingReceipt = receipt.id && !receipt.id.startsWith('temp-');
    
    if (isExistingReceipt) {
      // Verify the receipt exists and belongs to this user
      const { data: existingReceipt, error: checkError } = await supabase
        .from("receipts")
        .select("id, user_id")
        .eq("id", receipt.id)
        .single();

      if (checkError || !existingReceipt) {
        console.warn("Receipt not found, will create new:", checkError);
        // Fall through to create new receipt
      } else if (existingReceipt.user_id !== user.id) {
        return {
          success: false,
          message: "You don't have permission to edit this receipt.",
        };
      }
    } else {
      // For new receipts, check for duplicates (same store, date, and total)
      const { data: existingReceipts, error: checkError } = await supabase
        .from("receipts")
        .select("id, store_name, purchase_date, total_amount")
        .eq("user_id", user.id)
        .eq("store_name", receipt.store)
        .eq("purchase_date", receipt.date)
        .eq("total_amount", receipt.total);

      if (checkError) {
        console.warn("Error checking for duplicates:", checkError);
      } else if (existingReceipts && existingReceipts.length > 0) {
        return {
          success: false,
          message: `Duplicate receipt detected! A receipt from "${receipt.store}" on ${receipt.date} for ${receipt.total.toFixed(2)} already exists in your database.`,
        };
      }
    }

    // Upload image to Supabase Storage
    const timestamp = Date.now();
    const sanitizedFileName = imageFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${user.id}/${timestamp}_${sanitizedFileName}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("RecieptsImages")
      .upload(fileName, imageFile, {
        contentType: imageFile.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const imagePath = uploadData.path;
    console.log("Image uploaded successfully to:", imagePath);

    // Prepare receipt data
    const receiptDataToSave = {
      user_id: user.id,
      image_path: imagePath,
      store_name: receipt.store,
      purchase_date: receipt.date,
      total_amount: receipt.total,
      currency: "EUR",
      tax_amount: receipt.tax,
      confidence_score: receipt.confidence || 0.85,
      ocr_raw_text: receipt.rawText,
      status: "completed",
      anomalies: [], // Will be populated below
    };

    // 🔍 ANOMALY DETECTION
    const detectedAnomalies: AnomalyFlag[] = [];

    // 1. Low OCR confidence check
    if (receipt.confidence && receipt.confidence < 0.7) {
      detectedAnomalies.push("ocr_mismatch");
    }

    // 2. Tax mismatch check (tax should be ~10-20% of subtotal in most countries)
    const subtotal = receipt.total - receipt.tax;
    const taxRate = subtotal > 0 ? (receipt.tax / subtotal) * 100 : 0;
    if (taxRate > 0 && (taxRate < 5 || taxRate > 30)) {
      detectedAnomalies.push("tax_mismatch");
    }

    // 3. Spending spike detection - compare to user's average
    if (!isExistingReceipt) {
      const { data: recentReceipts } = await supabase
        .from("receipts")
        .select("total_amount")
        .eq("user_id", user.id)
        .order("purchase_date", { ascending: false })
        .limit(20);

      if (recentReceipts && recentReceipts.length > 5) {
        const avgAmount = recentReceipts.reduce((sum, r) => sum + Number(r.total_amount), 0) / recentReceipts.length;
        // Flag if this receipt is 3x higher than average
        if (receipt.total > avgAmount * 3) {
          detectedAnomalies.push("spike");
        }
      }
    }

    // 4. Duplicate detection
    if (!isExistingReceipt) {
      const { data: potentialDuplicates } = await supabase
        .from("receipts")
        .select("id, store_name, purchase_date, total_amount")
        .eq("user_id", user.id)
        .eq("store_name", receipt.store)
        .eq("purchase_date", receipt.date)
        .gte("total_amount", receipt.total - 1) // Within $1 range
        .lte("total_amount", receipt.total + 1);

      if (potentialDuplicates && potentialDuplicates.length > 0) {
        detectedAnomalies.push("duplicate");
      }
    }

    receiptDataToSave.anomalies = detectedAnomalies;

    let finalReceiptId: string;

    // Update existing receipt or insert new one
    if (isExistingReceipt) {
      console.log(`📝 Updating existing receipt: ${receipt.id}`);
      
      const { data: updatedReceipt, error: updateError } = await supabase
        .from("receipts")
        .update(receiptDataToSave)
        .eq("id", receipt.id)
        .select()
        .single();

      if (updateError) {
        console.error("Receipt update error:", updateError);
        throw new Error(`Failed to update receipt: ${updateError.message}`);
      }

      finalReceiptId = updatedReceipt.id;
      console.log("✅ Receipt updated successfully");

      // Delete old items before inserting new ones
      const { error: deleteError } = await supabase
        .from("receipt_items")
        .delete()
        .eq("receipt_id", finalReceiptId);

      if (deleteError) {
        console.warn("Warning: Could not delete old items:", deleteError);
      }
    } else {
      console.log(`📝 Creating new receipt`);
      
      const { data: insertedReceipt, error: insertError } = await supabase
        .from("receipts")
        .insert(receiptDataToSave)
        .select()
        .single();

      if (insertError) {
        console.error("Receipt insert error:", insertError);
        throw new Error(`Failed to save receipt: ${insertError.message}`);
      }

      finalReceiptId = insertedReceipt.id;
      console.log("✅ Receipt created successfully");
    }

    // Insert receipt items
    if (receipt.items && receipt.items.length > 0) {
      const itemsToInsert = receipt.items.map((item) => {
        const itemData = {
          receipt_id: finalReceiptId,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.total,
          category_id: item.categoryId || null // Use null if no category
        };
        
        console.log(`📦 Preparing item: "${item.description}" | Category: ${item.categoryId || 'NONE'} | Price: $${item.total}`);
        return itemData;
      });

      console.log(`💾 Saving ${itemsToInsert.length} items to database...`);

      const { data: insertedItems, error: itemsError } = await supabase
        .from("receipt_items")
        .insert(itemsToInsert)
        .select();

      if (itemsError) {
        console.error("❌ Items insert error:", itemsError);
        console.error("Error details:", JSON.stringify(itemsError, null, 2));
        console.error("Attempted to insert items:", JSON.stringify(itemsToInsert, null, 2));
        // Don't throw - receipt is already saved, items are optional
      } else {
        console.log(`✅ Saved ${receipt.items.length} items to database`);
        insertedItems?.forEach((item: any) => {
          console.log(`  ✓ ${item.description}: $${item.total_price} → Category: ${item.category_id || 'UNCATEGORIZED'}`);
        });
      }
    }

    // Note: Budget spent amounts are calculated dynamically when fetching budgets
    // No need to update a separate column

    const actionVerb = isExistingReceipt ? "updated" : "saved";
    return {
      success: true,
      receiptId: finalReceiptId,
      receipt: { ...receipt, id: finalReceiptId },
      message: `Receipt ${actionVerb} successfully!`,
    };
  } catch (error) {
    console.error("Save error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to save receipt",
    };
  }
}

// --- DATA: RECEIPTS (REAL SUPABASE) ---

export async function getReceipts(): Promise<Receipt[]> {
  try {
    const { data, error } = await supabase
      .from("receipts")
      .select(`*`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return [];

    // Map Supabase rows to UI Receipt type
    return data.map((r: any) => ({
      id: r.id,
      store: r.store_name || "Unknown",
      date: r.purchase_date || new Date().toISOString(),
      categoryId: "", // Receipts don't have categories, only items do
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
    console.error("Error fetching receipts:", err);
    throw err;
  }
}

export async function deleteReceipt(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Verify receipt belongs to user before deleting
    const { data: receipt, error: fetchError } = await supabase
      .from("receipts")
      .select("id, user_id, image_path")
      .eq("id", id)
      .single();

    if (fetchError || !receipt) {
      return {
        success: false,
        message: "Receipt not found",
      };
    }

    if (receipt.user_id !== user.id) {
      return {
        success: false,
        message: "You don't have permission to delete this receipt",
      };
    }

    // Delete receipt (cascade will delete receipt_items automatically)
    const { error: deleteError } = await supabase
      .from("receipts")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error("Error deleting receipt:", deleteError);
      throw new Error(`Failed to delete receipt: ${deleteError.message}`);
    }

    // Delete image from storage
    if (receipt.image_path) {
      const { error: storageError } = await supabase.storage
        .from("RecieptsImages")
        .remove([receipt.image_path]);

      if (storageError) {
        console.warn("Warning: Failed to delete image from storage:", storageError);
        // Don't fail the whole operation if image deletion fails
      }
    }

    console.log("✅ Receipt deleted successfully:", id);

    return {
      success: true,
      message: "Receipt deleted successfully",
    };
  } catch (err) {
    console.error("Error deleting receipt:", err);
    return {
      success: false,
      message: err instanceof Error ? err.message : "Failed to delete receipt",
    };
  }
}

export async function getReceiptById(id: string): Promise<Receipt> {
  try {
    const { data, error } = await supabase
      .from("receipts")
      .select(`*`)
      .eq("id", id)
      .single();

    if (error) throw error;

    // Fetch receipt items
    const { data: itemsData } = await supabase
      .from("receipt_items")
      .select("*")
      .eq("receipt_id", id);

    const items: ReceiptItem[] = (itemsData || []).map((item: any) => ({
      id: item.id,
      description: item.description,
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unit_price) || 0,
      total: Number(item.total_price) || 0,
      categoryId: item.category_id || "uncategorized",
    }));

    // Generate signed URL for image (valid for 1 hour)
    let imageUrl = data.image_path;
    if (data.image_path) {
      console.log("Attempting to generate signed URL for:", data.image_path);
      const { data: signedData, error: signedError } = await supabase.storage
        .from("RecieptsImages")
        .createSignedUrl(data.image_path, 3600);
      
      if (signedError) {
        console.error("Signed URL error:", signedError);
      } else if (signedData?.signedUrl) {
        imageUrl = signedData.signedUrl;
        console.log("Generated signed URL:", imageUrl);
      } else {
        console.warn("No signed URL generated, using path:", data.image_path);
      }
    }

    return {
      id: data.id,
      store: data.store_name,
      date: data.purchase_date,
      categoryId: "", // Receipts don't have categories, only items do
      total: Number(data.total_amount),
      tax: Number(data.tax_amount),
      status: data.status,
      anomalyFlags: data.anomalies || [],
      imageUrl: imageUrl,
      ocrConfidence: data.confidence_score,
      rawText: data.ocr_raw_text,
      items: items,
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
  try {
    const { data, error } = await supabase.from("categories").select("*");
    
    if (error) {
      console.error("Error fetching categories:", error);
      throw new Error("Failed to fetch categories. Please run seed-categories.ts first.");
    }
    
    if (!data || data.length === 0) {
      throw new Error("No categories found in database. Please run: npx tsx seed-categories.ts");
    }
    
    return data.map((c: any) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      description: c.description,
    }));
  } catch (err) {
    console.error("Failed to get categories:", err);
    throw err;
  }
}

// --- MOCKS (For features not yet implemented) ---

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Get current month
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const monthStr = `${year}-${String(month).padStart(2, '0')}-01`;

    // 🚀 ULTRA OPTIMIZED: Single query to pre-calculated dashboard_stats table
    const { data, error } = await supabase
      .from("dashboard_stats")
      .select("*")
      .eq("user_id", user.id)
      .eq("month", monthStr)
      .single();

    if (error && error.code !== 'PGRST116') { // Ignore "no rows" error
      console.error("Error fetching dashboard stats:", error);
    }

    const totalSpent = Number(data?.total_spent) || 0;
    const totalBudget = Number(data?.total_budget) || 0;
    const receiptsCount = data?.receipts_count || 0;
    const anomaliesCount = data?.anomalies_count || 0;

    console.log("📊 Dashboard Stats Raw Data:", {
      total_spent: data?.total_spent,
      total_budget: data?.total_budget,
      calculated_remaining: totalBudget - totalSpent,
    });

    return {
      totalSpentThisMonth: totalSpent,
      remainingBudget: totalBudget - totalSpent,
      receiptsThisMonth: receiptsCount,
      anomaliesDetected: anomaliesCount,
      spendingByCategory: [],
      spendingOverTime: [],
    };
  } catch (err) {
    console.error("Error fetching dashboard stats:", err);
    throw err;
  }
}

// --- CHART DATA ---

export async function getSpendingByCategory(): Promise<Array<{ name: string; value: number; color: string }>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // ✅ OPTIMIZED: Use pre-calculated spent_amount from budgets instead of joining tables
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const startDateStr = `${year}-${String(month).padStart(2, '0')}-01`;

    const { data: budgets, error } = await supabase
      .from("budgets")
      .select(`
        spent_amount,
        categories (name)
      `)
      .eq("user_id", user.id)
      .eq("month", startDateStr)
      .gt("spent_amount", 0);

    if (error) {
      console.error("Error fetching category spending:", error);
      return [];
    }

    // Convert to array format with colors
    const colors = ["#0ea5e9", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444"];
    let colorIndex = 0;
    
    return (budgets || []).map((budget: any) => ({
      name: budget.categories?.name || "Uncategorized",
      value: Number(budget.spent_amount) || 0,
      color: colors[colorIndex++ % colors.length],
    }));
  } catch (err) {
    console.warn("Failed to fetch category spending:", err);
    return [];
  }
}

export async function getSpendingOverTime(): Promise<Array<{ date: string; amount: number }>> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // 🚀 ULTRA OPTIMIZED: Query pre-calculated spending_over_time table
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const startDateStr = `${year}-${String(month).padStart(2, '0')}-01`;

    const { data, error } = await supabase
      .from("spending_over_time")
      .select("date, daily_total")
      .eq("user_id", user.id)
      .gte("date", startDateStr)
      .order("date", { ascending: true });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      date: row.date,
      amount: Number(row.daily_total) || 0,
    }));
  } catch (err) {
    console.warn("Failed to fetch spending over time:", err);
    return [];
  }
}

export async function getBudgets(month: string): Promise<Budget[]> {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error("Not authenticated: " + (authError?.message || "No user"));
    }

    // Convert month to date format for database
    const monthDate = month + "-01";
    console.log("Fetching budgets for user:", user.id, "month:", monthDate);

    // Fetch budgets with pre-calculated spent amounts (from database trigger)
    const { data: budgetData, error } = await supabase
      .from("budgets")
      .select("id, category_id, limit_amount, spent_amount, month")
      .eq("user_id", user.id)
      .eq("month", monthDate);

    if (error) {
      console.error("Error fetching budgets:", error);
      throw error;
    }

    if (!budgetData || budgetData.length === 0) {
      console.log("No budgets found for month:", month);
      return [];
    }

    console.log("Found budgets:", budgetData.length);

    // Fetch categories separately
    const categoryIds = budgetData.map((b: any) => b.category_id).filter(Boolean);
    const { data: categoriesData } = await supabase
      .from("categories")
      .select("id, name")
      .in("id", categoryIds);

    const categoryMap = new Map(categoriesData?.map(c => [c.id, c]) || []);

    // Map database budgets to UI format - using pre-calculated spent_amount
    return budgetData.map((b: any) => {
      const category = categoryMap.get(b.category_id);
      const spent = Number(b.spent_amount) || 0;
      const limit = Number(b.limit_amount) || 0;
      
      console.log(`Budget ${category?.name || 'Unknown'}: $${spent} / $${limit}`);
      
      return {
        id: b.id,
        categoryId: b.category_id || "unknown",
        categoryName: category?.name || "Unknown Category",
        limit: limit,
        spent: spent, // ✅ Now using pre-calculated value from database!
        month: month,
      };
    });
  } catch (err) {
    console.error("Fatal error in getBudgets:", err);
    return [];
  }
}

export async function updateBudget(
  budgetId: string,
  limit: number,
): Promise<Budget> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    console.log("Updating budget:", budgetId, "with limit:", limit);

    // Update the budget limit
    const { data, error } = await supabase
      .from("budgets")
      .update({ limit_amount: limit })
      .eq("id", budgetId)
      .eq("user_id", user.id)
      .select("id, category_id, limit_amount, spent_amount, month")
      .single();

    if (error) {
      console.error("Error updating budget:", error);
      throw error;
    }

    if (!data) {
      throw new Error("Budget not found");
    }

    // Fetch category separately
    const { data: categoryData } = await supabase
      .from("categories")
      .select("id, name")
      .eq("id", data.category_id)
      .single();

    // Extract month in YYYY-MM format
    const monthStr = data.month ? data.month.substring(0, 7) : "";

    return {
      id: data.id,
      categoryId: data.category_id || "unknown",
      categoryName: categoryData?.name || "Unknown Category",
      limit: Number(data.limit_amount) || 0,
      spent: Number(data.spent_amount) || 0, // ✅ Using pre-calculated value
      month: monthStr,
    };
  } catch (err) {
    console.error("Failed to update budget:", err);
    throw err;
  }
}

export async function createBudget(payload: {
  categoryId: string;
  limit: number;
  month: string;
}): Promise<Budget> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Convert month from YYYY-MM to YYYY-MM-01 for database
    const monthDate = payload.month + "-01";
    
    console.log("Creating budget for category:", payload.categoryId, "month:", monthDate);

    // Insert new budget
    const { data, error } = await supabase
      .from("budgets")
      .insert({
        user_id: user.id,
        category_id: payload.categoryId,
        limit_amount: payload.limit,
        month: monthDate,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Error creating budget:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      throw error;
    }

    if (!data) {
      throw new Error("Failed to create budget");
    }

    // Fetch category separately
    const { data: categoryData } = await supabase
      .from("categories")
      .select("id, name")
      .eq("id", data.category_id)
      .single();

    // Calculate spent amount for this category and month (will be 0 for new budgets)
    const monthStart = data.month;
    const monthEnd = new Date(new Date(data.month).setMonth(new Date(data.month).getMonth() + 1)).toISOString().split('T')[0];
    
    const { data: receiptsData } = await supabase
      .from("receipts")
      .select("total_amount")
      .eq("user_id", user.id)
      .eq("category_id", data.category_id)
      .gte("purchase_date", monthStart)
      .lt("purchase_date", monthEnd);

    const spent = receiptsData?.reduce((sum, r: any) => sum + (Number(r.total_amount) || 0), 0) || 0;

    // Extract month in YYYY-MM format
    const monthStr = data.month ? data.month.substring(0, 7) : payload.month;

    return {
      id: data.id,
      categoryId: data.category_id || payload.categoryId,
      categoryName: categoryData?.name || "Unknown Category",
      limit: Number(data.limit_amount) || 0,
      spent: spent,
      month: monthStr,
    };
  } catch (err) {
    console.error("Failed to create budget:", err);
    throw err;
  }
}

export async function getWeeklyReport(): Promise<WeeklyReport> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Calculate current week's start (Monday) and end (Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday (0), go back 6 days
    
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    // Fetch receipts for the current week
    const { data: receiptsData, error } = await supabase
      .from("receipts")
      .select(`
        id,
        store_name,
        purchase_date,
        total_amount,
        tax_amount,
        status,
        anomalies,
        image_path,
        confidence_score,
        ocr_raw_text,
        categories (id, name)
      `)
      .eq("user_id", user.id)
      .gte("purchase_date", weekStartStr)
      .lte("purchase_date", weekEndStr)
      .order("purchase_date", { ascending: false });

    if (error) {
      console.error("Error fetching weekly receipts:", error);
      throw error;
    }

    // Map receipts to UI format
    const receipts: Receipt[] = (receiptsData || []).map((r: any) => ({
      id: r.id,
      store: r.store_name || "Unknown",
      date: r.purchase_date || new Date().toISOString(),
      categoryId: r.categories?.name || "Uncategorized",
      total: Number(r.total_amount) || 0,
      tax: Number(r.tax_amount) || 0,
      status: r.status || "processed",
      anomalyFlags: r.anomalies || [],
      imageUrl: r.image_path,
      ocrConfidence: r.confidence_score || 0,
      rawText: r.ocr_raw_text || "",
      items: [],
    }));

    // Calculate stats
    const totalSpent = receipts.reduce((sum, r) => sum + r.total, 0);
    const receiptCount = receipts.length;
    const anomaliesCount = receipts.filter(r => r.anomalyFlags.length > 0).length;

    // Generate highlights based on spending patterns
    const highlights: WeeklyHighlight[] = [];
    
    if (totalSpent === 0) {
      highlights.push({
        title: "No Spending This Week",
        description: "You haven't recorded any receipts this week.",
        type: "info",
      });
    } else {
      // Category spending analysis
      const categorySpending = new Map<string, number>();
      receipts.forEach(r => {
        const current = categorySpending.get(r.categoryId) || 0;
        categorySpending.set(r.categoryId, current + r.total);
      });

      const topCategory = Array.from(categorySpending.entries())
        .sort((a, b) => b[1] - a[1])[0];

      if (topCategory) {
        highlights.push({
          title: `Top Spending: ${topCategory[0]}`,
          description: `You spent ${topCategory[1].toFixed(2)} on ${topCategory[0]} this week.`,
          type: "info",
        });
      }

      // Anomaly warnings
      if (anomaliesCount > 0) {
        highlights.push({
          title: "Anomalies Detected",
          description: `${anomaliesCount} receipt(s) have been flagged for review.`,
          type: "warning",
        });
      } else {
        highlights.push({
          title: "No Anomalies",
          description: "All receipts look good this week!",
          type: "success",
        });
      }

      // Average transaction
      const avgTransaction = totalSpent / receiptCount;
      highlights.push({
        title: "Average Transaction",
        description: `Your average receipt value this week is ${avgTransaction.toFixed(2)}.`,
        type: "info",
      });
    }

    return {
      weekStart: weekStartStr,
      weekEnd: weekEndStr,
      totalSpent,
      receiptCount,
      anomaliesCount,
      highlights,
      receipts,
    };
  } catch (err) {
    console.error("Error generating weekly report:", err);
    throw err;
  }
}
