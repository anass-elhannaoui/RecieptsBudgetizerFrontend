# Receipt Budgetizer - Complete Project Documentation

## 📋 Table of Contents
- [Project Overview](#project-overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Database Schema](#database-schema)
- [Application Structure](#application-structure)
- [Key Components](#key-components)
- [API & Data Flow](#api--data-flow)
- [Setup & Installation](#setup--installation)
- [Usage Guide](#usage-guide)
- [Recent Features](#recent-features)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

**Receipt Budgetizer** is a modern, intelligent budget management application that helps users track their expenses through receipt scanning and automated data extraction. The application combines OCR technology, AI-powered parsing, and smart budget tracking to provide a comprehensive financial management solution.

### Core Purpose
- **Receipt Digitization**: Upload receipt images and automatically extract transaction data
- **Budget Management**: Set category-based budgets and track spending against limits
- **Expense Analytics**: Visualize spending patterns through charts and reports
- **Anomaly Detection**: Automatically flag suspicious transactions and data extraction issues
- **AI Validation**: Intelligent quality checks on extracted receipt data

---

## ✨ Features

### 1. Receipt Scanning & OCR
- **Two Parsing Methods**:
  - **Regex Parser**: Pattern-based extraction (fast, works offline)
  - **AI Parser**: OpenAI-powered extraction (accurate, handles complex receipts)
- **Support for Multiple Formats**: Works with various receipt layouts and languages
- **Image Processing**: Handles photos from mobile devices
- **Preview & Edit**: Review extracted data before saving

### 2. Intelligent Data Extraction
- **Store Name**: Automatically identifies merchant/store
- **Purchase Date**: Extracts transaction date with format detection
- **Line Items**: Parses individual items with:
  - Description
  - Quantity
  - Unit price
  - Total price
  - Auto-categorization
- **Tax Calculation**: Separates tax from total amount
- **OCR Confidence Scoring**: Quality metrics for extracted data

### 3. AI Validation System
Automatically validates extracted data for:
- **Suspicious Prices**: Detects negative, zero, or unrealistic amounts
- **Unusual Quantities**: Flags invalid quantity values
- **Unclear Descriptions**: Identifies placeholder or incomplete text
- **Calculation Errors**: Verifies quantity × price = total
- **Category Mismatches**: Checks if categories align with items

### 4. Budget Management
- **Category-Based Budgets**: Set monthly limits per category
- **Real-Time Tracking**: Live updates as receipts are added
- **Visual Indicators**: Color-coded progress bars
- **Alerts**: Notifications when approaching or exceeding limits
- **Multi-Month Support**: Track budgets across different time periods

### 5. Expense Analytics
- **Dashboard Overview**: Key metrics at a glance
  - Total spent this month
  - Remaining budget
  - Receipt count
  - Anomalies detected
- **Spending by Category**: Pie chart visualization
- **Spending Over Time**: Line chart showing daily spending trends
- **Weekly Reports**: Summarized weekly spending analysis

### 6. Anomaly Detection
Automatically flags transactions for:
- **Duplicates**: Same store, date, and amount
- **Spending Spikes**: Amounts 3x higher than average
- **OCR Mismatches**: Low confidence text recognition (<70%)
- **Tax Anomalies**: Unusual tax rates (outside 5-30% range)

### 7. Receipt Management
- **Organized Library**: Browse all receipts with filtering
- **Advanced Filters**:
  - Date range
  - Category
  - Anomaly status
- **Detailed View**: Full receipt breakdown with:
  - Image preview
  - All line items
  - Anomaly alerts
  - AI validation issues
  - Raw OCR text
- **Auditability**: Direct links from anomalies to receipts

### 8. User Authentication
- **Supabase Auth**: Secure authentication system
- **Email/Password**: Traditional login
- **Session Management**: Persistent login state
- **User Profiles**: Avatar and display name support

---

## 🛠 Technology Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **UI Library**: React 18+
- **Styling**: Tailwind CSS 4
- **Icons**: Lucide React
- **Charts**: Recharts

### Backend Services
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (receipt images)
- **OCR Service**: Python Flask Backend
  - Tesseract OCR for text extraction
  - OpenAI API for AI-powered parsing

**Supabase Configuration** (`lib/supabaseClient.ts`):
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
```

### State Management
- **React Hooks**: useState, useEffect, useMemo
- **Context API**: Auth provider
- **Local State**: Component-level state management

### Build Tools
- **Package Manager**: npm
- **Bundler**: Next.js built-in (Turbopack)
- **PostCSS**: For CSS processing
- **ESLint**: Code linting

---

## 🏗 Architecture

### Application Architecture
```
┌─────────────────────────────────────────────────────────┐
│                     Next.js Frontend                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Dashboard   │  │   Receipts   │  │    Budgets   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │    Scan      │  │    Weekly    │  │     Auth     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
┌───────────▼─────────────┐    ┌───────────▼─────────────┐
│   Supabase Backend      │    │   Flask OCR Service     │
│  ┌───────────────────┐  │    │  ┌──────────────────┐  │
│  │   PostgreSQL DB   │  │    │  │  Tesseract OCR   │  │
│  └───────────────────┘  │    │  └──────────────────┘  │
│  ┌───────────────────┐  │    │  ┌──────────────────┐  │
│  │   Auth Service    │  │    │  │   OpenAI API     │  │
│  └───────────────────┘  │    │  └──────────────────┘  │
│  ┌───────────────────┐  │    └─────────────────────────┘
│  │  Storage Bucket   │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

### Data Flow

#### Receipt Upload Flow
1. User uploads receipt image
2. Image sent to Flask OCR service
3. OCR extracts text (Tesseract or OpenAI)
4. AI validation checks data quality
5. Parsed data returned to frontend
6. User reviews and edits if needed
7. Confirmed data saved to Supabase
8. Image stored in Supabase Storage
9. Budget totals recalculated

#### Budget Tracking Flow
1. User creates monthly budget
2. Receipt saved → budget spending updated
3. Pre-calculated spending totals stored
4. Dashboard queries aggregated data
5. Charts render from cached totals

---

## 🗄 Database Schema

### Tables

#### `profiles`
User profile information
```sql
- id: uuid (PK, references auth.users)
- full_name: text
- avatar_url: text
- currency: text (default: 'EUR')
- created_at: timestamptz
- updated_at: timestamptz
```

#### `categories`
Expense categories
```sql
- id: uuid (PK)
- user_id: uuid (FK → auth.users)
- name: text (e.g., "Groceries", "Transport")
- icon: text
- description: text
- created_at: timestamptz
```

#### `receipts`
Receipt header information
```sql
- id: uuid (PK)
- user_id: uuid (FK → auth.users)
- image_path: text (Supabase Storage path)
- store_name: text
- purchase_date: date
- total_amount: numeric
- tax_amount: numeric
- currency: text (default: 'EUR')
- confidence_score: double precision
- ocr_raw_text: text
- status: text (pending|processing|completed|error)
- is_duplicate: boolean
- anomalies: jsonb (array of anomaly flags)
- created_at: timestamptz
```

#### `receipt_items`
Individual line items from receipts
```sql
- id: uuid (PK)
- receipt_id: uuid (FK → receipts)
- description: text
- quantity: numeric (default: 1)
- unit_price: numeric
- total_price: numeric
- category_id: uuid (FK → categories)
- ai_validation_flags: jsonb (NEW - validation issues)
- ai_confidence: double precision (NEW - 0-1 confidence)
```

#### `budgets`
Monthly budget limits by category
```sql
- id: uuid (PK)
- user_id: uuid (FK → auth.users)
- category_id: uuid (FK → categories)
- month: date (YYYY-MM-01)
- limit_amount: numeric
- spent_amount: numeric (pre-calculated)
- created_at: timestamptz
```

#### `dashboard_stats`
Pre-aggregated dashboard statistics
```sql
- id: uuid (PK)
- user_id: uuid (FK → auth.users)
- month: date
- total_spent: numeric
- total_budget: numeric
- receipts_count: integer
- anomalies_count: integer
- updated_at: timestamptz
```

#### `spending_over_time`
Daily spending totals for charts
```sql
- id: uuid (PK)
- user_id: uuid (FK → auth.users)
- date: date
- daily_total: numeric
- updated_at: timestamptz
```

#### `weekly_reports`
Weekly spending summaries
```sql
- id: uuid (PK)
- user_id: uuid (FK → auth.users)
- week_start_date: date
- total_spent: numeric
- anomaly_count: integer
- report_json: jsonb
- created_at: timestamptz
```

### Key Relationships
- Users → Receipts (one-to-many)
- Receipts → Receipt Items (one-to-many)
- Categories → Receipt Items (one-to-many)
- Categories → Budgets (one-to-many)
- Users → Categories (one-to-many, for custom categories)

---

## 📁 Application Structure

```
RecieptBudgetizer/
├── public/                    # Static assets
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (app)/            # Authenticated routes
│   │   │   ├── layout.tsx    # Sidebar + navbar layout
│   │   │   ├── dashboard/    # Dashboard page
│   │   │   ├── receipts/     # Receipt list & detail
│   │   │   │   └── [id]/     # Receipt detail view
│   │   │   ├── scan/         # Receipt upload & scanning
│   │   │   ├── budgets/      # Budget management
│   │   │   └── weekly-report/# Weekly summary
│   │   ├── (auth)/           # Authentication routes
│   │   │   ├── login/        # Login page
│   │   │   └── register/     # Registration page
│   │   ├── api-mocks/        # Mock data for development
│   │   ├── layout.tsx        # Root layout
│   │   ├── page.tsx          # Landing/redirect page
│   │   └── globals.css       # Global styles
│   ├── components/           # React components
│   │   ├── ui/              # UI primitives (buttons, cards, etc.)
│   │   ├── providers/       # React context providers
│   │   ├── navbar.tsx       # Top navigation bar
│   │   ├── sidebar.tsx      # Side navigation
│   │   ├── budget-card.tsx  # Budget display component
│   │   ├── receipt-card.tsx # Receipt list item
│   │   ├── receipt-detail-view.tsx # Full receipt view
│   │   ├── upload-dropzone.tsx     # Receipt upload UI
│   │   ├── spending-by-category-chart.tsx
│   │   ├── spending-over-time-chart.tsx
│   │   ├── weekly-report-summary.tsx
│   │   └── stat-widget.tsx  # Dashboard stat cards
│   └── lib/                 # Utilities & config
│       ├── api-client.ts    # API functions
│       ├── supabaseClient.ts# Supabase configuration
│       ├── types.ts         # TypeScript types
│       ├── utils.ts         # Helper functions
│       └── mock-data.ts     # Development mock data
├── seed-budgets.ts          # Budget seeding script
├── seed-categories.ts       # Category seeding script
├── cleanup-categories.ts    # Utility script
├── add-ai-validation-columns.sql  # Database migration
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next-env.d.ts
```

---

## 🧩 Key Components

### Pages

#### Dashboard (`/dashboard`)
- Overview of financial health
- Key metrics (spent, remaining, receipts, anomalies)
- Spending charts (by category, over time)
- Latest receipts preview
- Budget alerts for overspending

#### Receipts (`/receipts`)
- Paginated list of all receipts
- Filters: date range, category, anomaly status
- Quick actions: view details, delete
- Sorting and search capabilities

#### Receipt Detail (`/receipts/[id]`)
- Receipt image preview
- Store, date, total, tax information
- Complete line items table with AI validation status
- Anomaly alerts (duplicates, spikes, etc.)
- **Items Requiring Attention** section for AI-flagged items
- Raw OCR text for verification
- Audit information

#### Scan (`/scan`)
- Drag-and-drop file upload
- Choice between regex and AI parsing
- Real-time progress indicator
- Preview extracted data
- Edit items before saving
- Category assignment per item
- AI validation warnings

#### Budgets (`/budgets`)
- Monthly budget overview
- Create new budgets by category
- Visual progress bars
- Edit budget limits
- Global budget statistics
- Month selector

#### Weekly Report (`/weekly-report`)
- 7-day spending summary
- Receipt list with anomaly badges
- Highlights and insights
- Export to CSV
- Direct links to flagged receipts

### Core Components

#### `upload-dropzone.tsx`
Receipt upload and parsing interface
- File selection (drag & drop or click)
- Image preview
- Parser selection (regex/AI)
- Editable preview with inline validation
- Item-level confidence scores
- Save to database

#### `receipt-detail-view.tsx`
Comprehensive receipt display with AI validation visualization

```typescript
'use client';

import { Receipt, ReceiptItem, AIValidationFlag } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Props {
  receipt: Receipt;
  categories: Category[];
}

export default function ReceiptDetailView({ receipt, categories }: Props) {
  // Helper to get human-readable AI validation messages
  const getAIValidationDetails = (flags: AIValidationFlag[]) => {
    const details: Record<AIValidationFlag, { message: string; action: string }> = {
      price_suspicious: {
        message: 'Price appears suspicious (negative, zero, or unrealistic)',
        action: 'Verify the price is correct and positive',
      },
      quantity_unusual: {
        message: 'Quantity is unusual (negative, zero, or non-integer)',
        action: 'Check if the quantity makes sense for this item',
      },
      description_unclear: {
        message: 'Description is too short or contains placeholder text',
        action: 'Provide a more detailed item description',
      },
      category_mismatch: {
        message: 'Category may not match the item type',
        action: 'Review and update the category if needed',
      },
      total_calculation_error: {
        message: 'Total price doesn\'t match quantity × unit price',
        action: 'Verify the calculation or check for discounts',
      },
    };

    return flags.map(flag => details[flag]);
  };

  // Filter items that need attention
  const flaggedItems = receipt.items.filter(
    item => item.aiValidationFlags && item.aiValidationFlags.length > 0
  );

  return (
    <div className="space-y-6">
      {/* Items Requiring Attention */}
      {flaggedItems.length > 0 && (
        <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                Items Requiring Attention ({flaggedItems.length})
              </h3>
            </div>
            
            <div className="space-y-4">
              {flaggedItems.map(item => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-amber-200"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-gray-600">
                        {item.quantity} × €{item.unitPrice.toFixed(2)} = €{item.totalPrice.toFixed(2)}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-amber-100">
                      {Math.round((item.aiConfidence || 0) * 100)}% confidence
                    </Badge>
                  </div>

                  <div className="space-y-2 mt-3">
                    {item.aiValidationFlags?.map(flag => {
                      const details = getAIValidationDetails([flag])[0];
                      return (
                        <div key={flag} className="text-sm">
                          <p className="text-amber-800 dark:text-amber-200 font-medium">
                            ⚠️ {details.message}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400 ml-5">
                            → {details.action}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Line Items Table */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Line Items</h3>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Description</th>
                <th className="text-right py-2">Qty</th>
                <th className="text-right py-2">Unit Price</th>
                <th className="text-right py-2">Total</th>
                <th className="text-center py-2">AI Status</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map(item => (
                <tr
                  key={item.id}
                  className={`border-b ${
                    item.aiValidationFlags && item.aiValidationFlags.length > 0
                      ? 'bg-amber-50 dark:bg-amber-950/10'
                      : ''
                  }`}
                >
                  <td className="py-3">{item.description}</td>
                  <td className="text-right">{item.quantity}</td>
                  <td className="text-right">€{item.unitPrice.toFixed(2)}</td>
                  <td className="text-right">€{item.totalPrice.toFixed(2)}</td>
                  <td className="text-center">
                    {item.aiValidationFlags && item.aiValidationFlags.length > 0 ? (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {item.aiValidationFlags.length} issues
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        OK
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
```

#### `spending-by-category-chart.tsx`
Pie chart visualization with percentage-only labels

```typescript
'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card } from '@/components/ui/card';

interface SpendingData {
  name: string;
  value: number;
  color: string;
}

interface Props {
  data: SpendingData[];
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#14b8a6', // teal
];

export default function SpendingByCategoryChart({ data }: Props) {
  const chartData = data.map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Spending by Category</h3>
      <ResponsiveContainer width="100%" height={288}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
            outerRadius={70}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number) => `€${value.toFixed(2)}`}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry: any) => (
              `${value} (€${entry.payload.value.toFixed(2)})`
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </Card>
  );
}
```

#### `spending-over-time-chart.tsx`
Line chart for daily spending
- Shows trends over time
- Smooth curve rendering
- Date-based X-axis

#### `budget-card.tsx`
Individual budget display
- Category name and icon
- Progress bar with percentage
- Spent/limit amounts
- Color coding (green/yellow/red)
- Edit functionality

---

## 🔄 API & Data Flow

### API Client (`lib/api-client.ts`)

Main functions organized by feature:

#### Authentication
- `login(email, password)` - User login
- `register(name, email, password)` - User registration
- `getCurrentUser()` - Get authenticated user info

#### Receipt Scanning
- `uploadReceipt(file)` - Regex-based parsing
- `uploadReceiptWithAI(file)` - AI-powered parsing

```typescript
export async function uploadReceiptWithAI(file: File): Promise<Receipt> {
  const formData = new FormData();
  formData.append('file', file);

  // Send to Flask OCR service
  const response = await fetch('http://localhost:5000/upload-ai', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('OCR processing failed');
  }

  const data = await response.json();

  // Parse the AI response
  const receipt: Receipt = {
    id: crypto.randomUUID(),
    userId: '', // Set by saveReceiptToDatabase
    imagePath: '',
    storeName: data.store_name || 'Unknown Store',
    purchaseDate: data.date || new Date().toISOString().split('T')[0],
    totalAmount: parseFloat(data.total || '0'),
    taxAmount: parseFloat(data.tax || '0'),
    currency: 'EUR',
    confidenceScore: data.confidence || 0,
    ocrRawText: data.raw_text || '',
    items: [],
    status: 'pending',
    isDuplicate: false,
    anomalies: [],
    createdAt: new Date().toISOString(),
  };

  // Parse line items and apply AI validation
  if (data.items && Array.isArray(data.items)) {
    for (const item of data.items) {
      const receiptItem: ReceiptItem = {
        id: crypto.randomUUID(),
        description: item.description || 'Unknown Item',
        quantity: parseFloat(item.quantity || '1'),
        unitPrice: parseFloat(item.unit_price || '0'),
        totalPrice: parseFloat(item.total_price || '0'),
      };

      // Validate each item with AI
      const validation = await validateItemWithAI(
        receiptItem,
        receipt.totalAmount,
        receipt.items
      );

      receiptItem.aiValidationFlags = validation.flags;
      receiptItem.aiConfidence = validation.confidence;

      receipt.items.push(receiptItem);
    }
  }

  return receipt;
}
```

- `saveReceiptToDatabase(receipt, imageFile)` - Save parsed data

```typescript
export async function saveReceiptToDatabase(
  receipt: Receipt,
  imageFile: File
): Promise<Receipt> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // 1. Upload image to Supabase Storage
  const fileName = `${user.id}/${Date.now()}_${imageFile.name}`;
  const { error: uploadError } = await supabase.storage
    .from('RecieptsImages')
    .upload(fileName, imageFile);

  if (uploadError) throw uploadError;

  // 2. Check for duplicate receipts
  const { data: existingReceipts } = await supabase
    .from('receipts')
    .select('id')
    .eq('user_id', user.id)
    .eq('store_name', receipt.storeName)
    .eq('purchase_date', receipt.purchaseDate)
    .eq('total_amount', receipt.totalAmount);

  const isDuplicate = existingReceipts && existingReceipts.length > 0;
  const anomalies: AnomalyFlag[] = [];

  if (isDuplicate) anomalies.push('duplicate');

  // 3. Check for spending spikes
  const { data: avgSpending } = await supabase
    .from('receipts')
    .select('total_amount')
    .eq('user_id', user.id);

  if (avgSpending && avgSpending.length > 0) {
    const avg = avgSpending.reduce((sum, r) => sum + r.total_amount, 0) / avgSpending.length;
    if (receipt.totalAmount > avg * 3) {
      anomalies.push('spike');
    }
  }

  // 4. Check OCR confidence
  if (receipt.confidenceScore && receipt.confidenceScore < 0.7) {
    anomalies.push('ocr_mismatch');
  }

  // 5. Check tax rate
  if (receipt.taxAmount > 0) {
    const taxRate = receipt.taxAmount / (receipt.totalAmount - receipt.taxAmount);
    if (taxRate < 0.05 || taxRate > 0.30) {
      anomalies.push('tax_mismatch');
    }
  }

  // 6. Insert receipt
  const { data: savedReceipt, error: receiptError } = await supabase
    .from('receipts')
    .insert({
      user_id: user.id,
      image_path: fileName,
      store_name: receipt.storeName,
      purchase_date: receipt.purchaseDate,
      total_amount: receipt.totalAmount,
      tax_amount: receipt.taxAmount,
      currency: receipt.currency,
      confidence_score: receipt.confidenceScore,
      ocr_raw_text: receipt.ocrRawText,
      status: 'completed',
      is_duplicate: isDuplicate,
      anomalies: anomalies,
    })
    .select()
    .single();

  if (receiptError) throw receiptError;

  // 7. Insert receipt items with AI validation flags
  const itemsToInsert = receipt.items.map(item => ({
    receipt_id: savedReceipt.id,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unitPrice,
    total_price: item.totalPrice,
    category_id: item.categoryId || null,
    ai_validation_flags: item.aiValidationFlags || [],
    ai_confidence: item.aiConfidence !== undefined ? item.aiConfidence : null,
  }));

  const { error: itemsError } = await supabase
    .from('receipt_items')
    .insert(itemsToInsert);

  if (itemsError) throw itemsError;

  return { ...receipt, id: savedReceipt.id, userId: user.id };
}
```

#### Receipt Management
- `getReceipts()` - Fetch all user receipts
- `getReceiptById(id)` - Get single receipt with items
- `deleteReceipt(id)` - Remove receipt and image

#### Categories
- `getCategories()` - Fetch all categories

#### Budgets
- `getBudgets(month)` - Get budgets for specific month
- `createBudget(categoryId, limit, month)` - Create new budget
- `updateBudget(budgetId, limit)` - Update budget limit

#### Analytics
- `getDashboardStats()` - Get aggregated dashboard metrics
- `getSpendingByCategory()` - Category spending breakdown
- `getSpendingOverTime()` - Daily spending data
- `getWeeklyReport()` - Weekly summary with receipts

#### AI Validation
- `validateItemWithAI(item, receiptTotal, allItems)` - Internal function

```typescript
export async function validateItemWithAI(
  item: ReceiptItem,
  receiptTotal: number,
  allItems: ReceiptItem[]
): Promise<{ flags: AIValidationFlag[]; confidence: number }> {
  const flags: AIValidationFlag[] = [];
  let confidenceScore = 1.0;

  // 1. Check for suspicious prices
  if (item.totalPrice <= 0 || item.unitPrice <= 0) {
    flags.push('price_suspicious');
    confidenceScore -= 0.3;
  }
  if (item.totalPrice > receiptTotal * 0.8) {
    flags.push('price_suspicious');
    confidenceScore -= 0.2;
  }

  // 2. Validate quantities
  if (item.quantity <= 0 || item.quantity > 100 || !Number.isInteger(item.quantity)) {
    flags.push('quantity_unusual');
    confidenceScore -= 0.2;
  }

  // 3. Check description quality
  if (!item.description || item.description.length < 3) {
    flags.push('description_unclear');
    confidenceScore -= 0.15;
  }
  const placeholders = ['item', 'product', 'unknown', 'n/a', '...'];
  if (placeholders.some(p => item.description.toLowerCase().includes(p))) {
    flags.push('description_unclear');
    confidenceScore -= 0.1;
  }

  // 4. Verify calculation: quantity × unitPrice should equal totalPrice
  const expectedTotal = item.quantity * item.unitPrice;
  const tolerance = 0.02; // 2 cent tolerance for rounding
  if (Math.abs(expectedTotal - item.totalPrice) > tolerance) {
    flags.push('total_calculation_error');
    confidenceScore -= 0.25;
  }

  // 5. Check for duplicate items (same description)
  const duplicates = allItems.filter(
    i => i !== item && 
    i.description.toLowerCase() === item.description.toLowerCase()
  );
  if (duplicates.length > 0) {
    confidenceScore -= 0.1;
  }

  return {
    flags,
    confidence: Math.max(0, confidenceScore)
  };
}
```

### Data Caching Strategy
- **Dashboard Stats**: Pre-calculated in `dashboard_stats` table
- **Budget Spending**: Stored in `budgets.spent_amount`
- **Daily Totals**: Cached in `spending_over_time` table
- **On-Demand**: Receipt details, items, categories

---

## 🚀 Setup & Installation

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Python 3.8+ (for OCR backend)
- Tesseract OCR installed (for regex parser)

### 1. Clone Repository
```bash
git clone <repository-url>
cd RecieptBudgetizer
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Supabase Setup

#### Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create new project
3. Note your project URL and anon key

#### Run Database Migrations
1. Open SQL Editor in Supabase dashboard
2. Run the schema from the database section above
3. Run `add-ai-validation-columns.sql` for AI validation support:

```sql
-- Add AI validation columns to receipt_items table
ALTER TABLE receipt_items
ADD COLUMN IF NOT EXISTS ai_validation_flags jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS ai_confidence double precision;

-- Add index for faster queries on validation flags
CREATE INDEX IF NOT EXISTS idx_receipt_items_ai_flags 
ON receipt_items USING gin(ai_validation_flags);

-- Create view for items with validation issues
CREATE OR REPLACE VIEW receipt_items_with_ai_issues AS
SELECT 
  ri.*,
  r.store_name,
  r.purchase_date,
  r.user_id,
  jsonb_array_length(ri.ai_validation_flags) as issue_count
FROM receipt_items ri
JOIN receipts r ON ri.receipt_id = r.id
WHERE jsonb_array_length(ri.ai_validation_flags) > 0
ORDER BY r.purchase_date DESC;

-- Add comment for documentation
COMMENT ON COLUMN receipt_items.ai_validation_flags IS 
'Array of AI validation flags: price_suspicious, quantity_unusual, description_unclear, category_mismatch, total_calculation_error';

COMMENT ON COLUMN receipt_items.ai_confidence IS 
'AI confidence score between 0 and 1, where 1 is highest confidence';
```

#### Create Storage Bucket
1. Go to Storage in Supabase dashboard
2. Create bucket named `RecieptsImages`
3. Set to public or configure RLS policies

### 4. Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. Seed Data
```bash
# Seed categories
npx tsx seed-categories.ts

# Seed budgets (optional)
npx tsx seed-budgets.ts
```

### 6. Flask OCR Backend
Set up the Python OCR service:
```bash
# Install Python dependencies
pip install flask pytesseract openai pillow

# Run Flask server
python ocr_service.py
```

Configure OpenAI API key for AI parsing:
```bash
export OPENAI_API_KEY=your_openai_key
```

**Flask OCR Service Example** (`ocr_service.py`):
```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import pytesseract
from PIL import Image
import openai
import os
import re

app = Flask(__name__)
CORS(app)

openai.api_key = os.getenv('OPENAI_API_KEY')

@app.route('/upload', methods=['POST'])
def upload_receipt():
    """Regex-based OCR parsing"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    image = Image.open(file.stream)
    
    # Extract text using Tesseract
    raw_text = pytesseract.image_to_string(image)
    
    # Parse using regex patterns
    store_match = re.search(r'^(.+?)\n', raw_text)
    store_name = store_match.group(1) if store_match else 'Unknown'
    
    date_match = re.search(r'(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})', raw_text)
    date = date_match.group(1) if date_match else None
    
    total_match = re.search(r'TOTAL[:\s]+(\d+\.\d{2})', raw_text, re.IGNORECASE)
    total = float(total_match.group(1)) if total_match else 0
    
    tax_match = re.search(r'TAX[:\s]+(\d+\.\d{2})', raw_text, re.IGNORECASE)
    tax = float(tax_match.group(1)) if tax_match else 0
    
    # Parse line items
    items = []
    item_pattern = r'(.+?)\s+(\d+)\s+x\s+(\d+\.\d{2})\s+(\d+\.\d{2})'
    for match in re.finditer(item_pattern, raw_text):
        items.append({
            'description': match.group(1).strip(),
            'quantity': match.group(2),
            'unit_price': match.group(3),
            'total_price': match.group(4),
        })
    
    return jsonify({
        'store_name': store_name,
        'date': date,
        'total': total,
        'tax': tax,
        'items': items,
        'raw_text': raw_text,
        'confidence': 0.75,
    })

@app.route('/upload-ai', methods=['POST'])
def upload_receipt_ai():
    """AI-powered OCR parsing using OpenAI"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    
    file = request.files['file']
    image = Image.open(file.stream)
    
    # Extract text using Tesseract
    raw_text = pytesseract.image_to_string(image)
    
    # Use OpenAI to parse the receipt
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "You are a receipt parsing assistant. Extract structured data from receipt text."
                },
                {
                    "role": "user",
                    "content": f"""Parse this receipt and return JSON with:
- store_name
- date (YYYY-MM-DD format)
- total (number)
- tax (number)
- items (array with description, quantity, unit_price, total_price)

Receipt text:
{raw_text}"""
                }
            ],
            temperature=0.1,
        )
        
        import json
        parsed_data = json.loads(response.choices[0].message.content)
        parsed_data['raw_text'] = raw_text
        parsed_data['confidence'] = 0.95
        
        return jsonify(parsed_data)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
```

### 7. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📖 Usage Guide

### Getting Started

1. **Register Account**
   - Go to `/register`
   - Enter name, email, password
   - Automatic redirect to dashboard

2. **Set Up Categories**
   - Run seed script or create manually
   - Categories: Food, Groceries, Transport, etc.

3. **Create Budgets**
   - Go to `/budgets`
   - Click "Add Budget"
   - Select category and set monthly limit

4. **Upload First Receipt**
   - Go to `/scan`
   - Drag & drop receipt image
   - Choose parser (AI for complex receipts)
   - Review extracted data
   - Edit if needed
   - Save to database

5. **View Dashboard**
   - See spending overview
   - Check budget progress
   - Review anomalies

### Best Practices

#### Receipt Scanning
- **Good lighting**: Take photos in bright, even light
- **Flat receipt**: Smooth out wrinkles
- **Clear image**: Hold steady, focus properly
- **Full receipt**: Capture all items and totals
- **Use AI parser**: For receipts with unusual layouts

#### Budget Management
- **Start conservative**: Set realistic limits
- **Review monthly**: Adjust based on spending patterns
- **Category granularity**: Not too many, not too few
- **Regular updates**: Add receipts promptly

#### Anomaly Handling
- **Review flagged receipts**: Check each anomaly
- **Verify AI warnings**: Manually inspect low confidence items
- **Correct errors**: Edit incorrect extractions
- **Learn patterns**: Understand common false positives

---

## 🆕 Recent Features

### AI Validation System (December 2025)
Automatic quality checking for extracted receipt data.

**What It Does:**
- Validates each extracted item for potential issues
- Assigns confidence scores (0-100%)
- Flags suspicious data for manual review

**Validation Checks:**
1. **Price Suspicious**: Negative, zero, or extremely high prices
2. **Quantity Unusual**: Invalid or unrealistic quantities
3. **Description Unclear**: Too short or placeholder text
4. **Category Mismatch**: Category doesn't fit item
5. **Total Calculation Error**: Math doesn't add up

**User Experience:**
- Items flagged in amber/yellow
- Dedicated "Items Requiring Attention" section
- Detailed issue explanations
- Recommended corrective actions
- Confidence percentage display

**Database:**
- New columns: `ai_validation_flags`, `ai_confidence`
- Stored per item for historical tracking
- Queryable for analytics

### Auditability Links (December 2025)
Direct navigation from anomalies to receipts.

**Implementation:**
- **Weekly Report**: "View Receipt" buttons
- **Dashboard**: Clickable anomaly badges
- **Receipts Page**: Direct links to details
- **Receipt Detail**: Comprehensive issue display

**Benefits:**
- Faster anomaly investigation
- Clear audit trail
- Better user workflow
- Reduced clicks to resolution

---

## 🔧 Development

### Code Organization

#### Type Safety
All types defined in `lib/types.ts`:

```typescript
// Receipt anomaly types
export type AnomalyFlag = 'duplicate' | 'spike' | 'ocr_mismatch' | 'tax_mismatch';

// AI validation flags for individual items
export type AIValidationFlag = 
  | 'price_suspicious'
  | 'quantity_unusual'
  | 'description_unclear'
  | 'category_mismatch'
  | 'total_calculation_error';

// Receipt item with AI validation
export interface ReceiptItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  categoryId?: string;
  categoryName?: string;
  aiValidationFlags?: AIValidationFlag[];
  aiConfidence?: number; // 0-1 scale
}

// Complete receipt with all metadata
export interface Receipt {
  id: string;
  userId: string;
  imagePath: string;
  storeName: string;
  purchaseDate: string;
  totalAmount: number;
  taxAmount: number;
  currency: string;
  confidenceScore?: number;
  ocrRawText?: string;
  items: ReceiptItem[];
  status: 'pending' | 'processing' | 'completed' | 'error';
  isDuplicate: boolean;
  anomalies: AnomalyFlag[];
  createdAt: string;
}

// Budget with spending tracking
export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  categoryName: string;
  month: string; // YYYY-MM-DD format
  limitAmount: number;
  spentAmount: number;
  createdAt: string;
}

// Category definition
export interface Category {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}
```

#### Utility Functions (`lib/utils.ts`)
- `formatCurrency(amount)` - Format as EUR
- `formatDate(date)` - Display-friendly dates
- `downloadCsv(filename, data)` - Export to CSV
- `delay(ms)` - Async delay helper

#### Component Patterns
- **Client Components**: Use `"use client"` directive
- **Server Components**: Default for pages
- **Hooks**: Custom hooks in components when needed
- **Props**: TypeScript interfaces for all props

### Testing Strategy
- Manual testing for now
- Test checklist in `AI_VALIDATION_FIX_SUMMARY.md`
- Future: Unit tests, E2E tests

### Performance Optimizations
- Pre-calculated budget totals
- Cached dashboard statistics
- Optimized Supabase queries
- Pagination for large lists
- Lazy loading for charts

### Security Considerations
- Supabase Row Level Security (RLS)
- User-specific data isolation
- Signed URLs for images
- Environment variable protection
- SQL injection prevention

---

## 🐛 Troubleshooting

### Common Issues

#### "Categories not found"
**Solution**: Run seed script
```bash
npx tsx seed-categories.ts
```

#### OCR Service Connection Failed
**Problem**: Flask backend not running
**Solution**: 
```bash
python ocr_service.py
# Should show: Running on http://127.0.0.1:5000
```

#### Low OCR Accuracy
**Problem**: Poor image quality
**Solution**:
- Use better lighting
- Take photo from directly above
- Smooth out receipt
- Try AI parser instead

#### AI Validation Not Working
**Problem**: Database columns not added
**Solution**:
1. Run `add-ai-validation-columns.sql`
2. Restart Next.js server
3. Upload new receipt

#### Images Not Displaying
**Problem**: Storage bucket configuration
**Solution**:
1. Check bucket name is `RecieptsImages`
2. Verify RLS policies
3. Check signed URL generation

#### Budget Not Updating
**Problem**: Calculation trigger not fired
**Solution**:
- Receipts must be saved properly
- Check category_id is valid
- Verify month format (YYYY-MM-DD)

### Debug Mode
Enable detailed logging:
```typescript
// In api-client.ts, search for console.log statements
// They're already in place for debugging
```

### Database Queries
Useful queries for troubleshooting:

```sql
-- Check AI validation columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'receipt_items';

-- Find items with validation issues
SELECT * FROM receipt_items_with_ai_issues;

-- Check budget calculations
SELECT b.*, c.name as category_name
FROM budgets b
JOIN categories c ON b.category_id = c.id
WHERE user_id = 'your-user-id';

-- Find anomalous receipts
SELECT * FROM receipts 
WHERE jsonb_array_length(anomalies) > 0;
```

---

## 📝 Additional Resources

### Related Files
- `DATABASE_MIGRATION_README.md` - Migration instructions
- `AI_VALIDATION_FIX_SUMMARY.md` - AI feature details
- `add-ai-validation-columns.sql` - Database migration

### Future Enhancements
- **Mobile App**: React Native version
- **Bulk Upload**: Multiple receipts at once
- **Receipt Export**: PDF reports
- **Spending Predictions**: ML-based forecasting
- **Recurring Expenses**: Auto-detect subscriptions
- **Multi-Currency**: Support for multiple currencies
- **Team Budgets**: Shared budgets for families
- **Bank Integration**: Import transactions
- **Receipt Search**: Full-text search
- **Tax Reports**: Annual tax summaries

### Contributing
This is a personal project, but suggestions welcome!

### License
Private project - All rights reserved

### Support
For issues or questions, refer to the troubleshooting section above.

---

**Last Updated**: December 16, 2025
**Version**: 1.0.0
**Author**: Receipt Budgetizer Team
