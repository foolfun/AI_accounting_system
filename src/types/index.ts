export interface Category {
  id: string;
  name: string;
  type: "expense" | "income";
  icon: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  type: "expense" | "income";
  amount: number;
  categoryId: string | null;
  transactionDate: string;
  note: string;
  source: "ai" | "manual" | "import";
  rawText: string;
  aiConfidence: number | null;
  createdAt: string;
  updatedAt: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
}

export interface AnnualBudget {
  id: string;
  year: number;
  totalBudget: number | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryBudget {
  id: string;
  annualBudgetId: string;
  categoryId: string;
  budgetAmount: number;
  createdAt: string;
  updatedAt: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
}

export interface BudgetSummary {
  year: number;
  totalBudget: number | null;
  totalSpent: number;
  remainingBudget: number;
  remainingRatio: number;
  categories: CategoryBudgetSummary[];
}

export interface CategoryBudgetSummary {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  budget: number;
  spent: number;
  remaining: number;
  remainingRatio: number;
  status: "normal" | "warning" | "danger" | "over";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  intent?: string;
  parsedResult?: string;
  relatedTransactionId?: string;
  createdAt: string;
}

export interface ParsedResult {
  intent: string;
  amount?: number;
  currency?: string;
  date?: string;
  category?: string;
  note?: string;
  confidence?: number;
  needClarification?: boolean;
  clarificationQuestion?: string;
  year?: number;
  totalBudget?: number;
  categoryBudgets?: { category: string; amount: number }[];
  target?: string;
  updates?: Record<string, string>;
  transactions?: ParsedTransaction[];
  query?: {
    startDate?: string;
    endDate?: string;
    category?: string;
    keyword?: string;
  };
}

export interface ParsedTransaction {
  amount: number;
  category: string;
  note: string;
  date: string;
}
