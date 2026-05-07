import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { initDatabase } from "@/lib/db";
import { annualBudgets, categoryBudgets, transactions, categories } from "@/lib/db-schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { getStatusFromRatio } from "@/lib/utils";

let initialized = false;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ year: string }> }
) {
  if (!initialized) { initDatabase(); initialized = true; }

  try {
    const { year: yearStr } = await params;
    const year = parseInt(yearStr);

    const annual = await db.select().from(annualBudgets).where(eq(annualBudgets.year, year)).get();

    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;

    const yearTxs = await db.select().from(transactions).where(
      and(
        gte(transactions.transactionDate, yearStart),
        lte(transactions.transactionDate, yearEnd),
        eq(transactions.type, "expense")
      )
    ).all();
    const totalSpent = yearTxs.reduce((sum, t) => sum + t.amount, 0);

    if (!annual) {
      return NextResponse.json({
        year,
        totalBudget: null,
        totalSpent,
        remainingBudget: null,
        remainingRatio: null,
        categories: [],
      });
    }

    const allCats = await db.select().from(categories).all();
    const catMap = new Map(allCats.map((c) => [c.id, c]));

    const catBudgets = await db.select().from(categoryBudgets).where(
      eq(categoryBudgets.annualBudgetId, annual.id)
    ).all();

    const categorySummaries = catBudgets.map((cb) => {
      const cat = cb.categoryId ? catMap.get(cb.categoryId) : undefined;
      const spent = yearTxs.filter((t) => t.categoryId === cb.categoryId).reduce((sum, t) => sum + t.amount, 0);
      const remaining = cb.budgetAmount - spent;
      const ratio = cb.budgetAmount > 0 ? remaining / cb.budgetAmount : 0;
      const status = getStatusFromRatio(ratio);

      return {
        categoryId: cb.categoryId,
        categoryName: cat?.name || "未知",
        categoryIcon: cat?.icon || "📦",
        categoryColor: cat?.color || "#6b7280",
        budget: cb.budgetAmount,
        spent,
        remaining,
        remainingRatio: ratio,
        status: status as "normal" | "warning" | "danger" | "over",
      };
    });

    const remainingBudget = (annual.totalBudget || 0) - totalSpent;
    const remainingRatio = (annual.totalBudget || 0) > 0 ? remainingBudget / (annual.totalBudget || 1) : 0;

    return NextResponse.json({
      year,
      totalBudget: annual.totalBudget,
      totalSpent,
      remainingBudget,
      remainingRatio: Math.max(0, remainingRatio),
      categories: categorySummaries,
    });
  } catch (error) {
    console.error("GET /api/budgets error:", error);
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}
