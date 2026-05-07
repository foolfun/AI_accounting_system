import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  type: text("type", { enum: ["expense", "income"] }).notNull().default("expense"),
  icon: text("icon").notNull().default("📦"),
  color: text("color").notNull().default("#6b7280"),
  isDefault: integer("is_default", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const transactions = sqliteTable("transactions", {
  id: text("id").primaryKey(),
  type: text("type", { enum: ["expense", "income"] }).notNull().default("expense"),
  amount: real("amount").notNull(),
  categoryId: text("category_id").references(() => categories.id),
  transactionDate: text("transaction_date").notNull(),
  note: text("note").notNull().default(""),
  source: text("source", { enum: ["ai", "manual", "import"] }).notNull().default("ai"),
  rawText: text("raw_text").notNull().default(""),
  aiConfidence: real("ai_confidence"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const annualBudgets = sqliteTable("annual_budgets", {
  id: text("id").primaryKey(),
  year: integer("year").notNull(),
  totalBudget: real("total_budget"),
  currency: text("currency").notNull().default("CNY"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const categoryBudgets = sqliteTable("category_budgets", {
  id: text("id").primaryKey(),
  annualBudgetId: text("annual_budget_id").references(() => annualBudgets.id, { onDelete: "cascade" }),
  categoryId: text("category_id").references(() => categories.id),
  budgetAmount: real("budget_amount").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const chatMessages = sqliteTable("chat_messages", {
  id: text("id").primaryKey(),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  content: text("content").notNull(),
  intent: text("intent"),
  parsedResult: text("parsed_result"),
  relatedTransactionId: text("related_transaction_id"),
  createdAt: text("created_at").notNull(),
});
