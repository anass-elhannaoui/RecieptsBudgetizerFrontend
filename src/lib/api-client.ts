import {
  budgets,
  dashboardStats,
  categories,
  mockUser,
  parsedUploadReceipt,
  receipts,
  weeklyReport,
} from "./mock-data";
import { delay } from "./utils";
import {
  AuthResult,
  Budget,
  DashboardStats,
  ParsedReceipt,
  Receipt,
  UploadResult,
  User,
  WeeklyReport,
  Category,
} from "./types";

const NETWORK_DELAY = 550;

export async function login(
  email: string,
  password: string,
): Promise<AuthResult> {
  await delay(NETWORK_DELAY);
  if (!email || !password) {
    throw new Error("Email and password are required.");
  }
  const user: User = {
    ...mockUser,
    email,
  };
  return { user, token: "mock-token-123" };
}

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<AuthResult> {
  await delay(NETWORK_DELAY);
  if (!name || !email || !password) {
    throw new Error("All fields are required.");
  }
  const user: User = {
    id: `user-${Date.now()}`,
    name,
    email,
    avatarUrl: mockUser.avatarUrl,
  };
  return { user, token: "mock-token-registered" };
}

export async function getCurrentUser(): Promise<User> {
  await delay(250);
  return mockUser;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await delay(NETWORK_DELAY);
  return dashboardStats;
}

export async function getCategories(): Promise<Category[]> {
  await delay(200);
  return categories;
}

export async function getReceipts(): Promise<Receipt[]> {
  await delay(NETWORK_DELAY);
  return receipts;
}

export async function getReceiptById(id: string): Promise<Receipt> {
  await delay(NETWORK_DELAY);
  const receipt = receipts.find((r) => r.id === id);
  if (!receipt) {
    throw new Error("Receipt not found");
  }
  return receipt;
}

export async function uploadReceipt(
  file: File,
): Promise<UploadResult & { fileName: string; fileSize: number }>
{
  await delay(NETWORK_DELAY + 250);
  if (!file) {
    throw new Error("File is required");
  }
  const receipt: ParsedReceipt = {
    ...parsedUploadReceipt,
    id: `uploaded-${Date.now()}`,
    store: parsedUploadReceipt.store,
  };
  return {
    receipt,
    fileName: file.name,
    fileSize: file.size,
    message: "Upload processed successfully (mock).",
  };
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
  const budget = budgets.find((b) => b.id === budgetId);
  if (!budget) {
    throw new Error("Budget not found");
  }
  budget.limit = limit;
  return budget;
}

export async function createBudget(payload: Budget): Promise<Budget> {
  await delay(NETWORK_DELAY);
  budgets.push(payload);
  return payload;
}

export async function getWeeklyReport(): Promise<WeeklyReport> {
  await delay(NETWORK_DELAY);
  return weeklyReport;
}
