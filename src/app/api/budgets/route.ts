import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { currentYear } from "@/lib/utils";
import { db } from "@/lib/db";
import { initDatabase } from "@/lib/db";
import { annualBudgets, categoryBudgets, categories } from "@/lib/db-schema";
import { eq } from "drizzle-orm";

let initialized = false;

export async function POST(request: NextRequest) {
  if (!initialized) { initDatabase(); initialized = true; }

  try {
    const body = await request.json();
    const now = new Date().toISOString();
    const year = body.year || currentYear();

    // Check existing
    const existing = await db.select().from(annualBudgets).where(eq(annualBudgets.year, year)).get();
    let budgetId: string;

    if (existing) {
      budgetId = existing.id;
      await db.update(annualBudgets).set({
        totalBudget: body.totalBudget ?? existing.totalBudget,
        updatedAt: now,
      }).where(eq(annualBudgets.id, budgetId));
    } else {
      budgetId = uuid();
      await db.insert(annualBudgets).values({
        id: budgetId,
        year,
        totalBudget: body.totalBudget ?? null,
        currency: body.currency || "CNY",
        createdAt: now,
        updatedAt: now,
      });
    }

    // Handle category budgets
    if (body.categoryBudgets && Array.isArray(body.categoryBudgets)) {
      for (const cb of body.categoryBudgets) {
        const catId = cb.categoryId || cb.category_id;
        if (!catId) continue;

        const existingCb = await db.select().from(categoryBudgets).where(
          eq(categoryBudgets.annualBudgetId, budgetId)
        ).all();

        const match = existingCb.find((e) => e.categoryId === catId);
        if (match) {
          await db.update(categoryBudgets).set({
            budgetAmount: cb.amount || cb.budgetAmount,
            updatedAt: now,
          }).where(eq(categoryBudgets.id, match.id));
        } else {
          await db.insert(categoryBudgets).values({
            id: uuid(),
            annualBudgetId: budgetId,
            categoryId: catId,
            budgetAmount: cb.amount || cb.budgetAmount,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }

    return NextResponse.json({ id: budgetId, message: "预算设置成功" }, { status: 201 });
  } catch (error) {
    console.error("POST /api/budgets error:", error);
    return NextResponse.json({ error: "设置失败" }, { status: 500 });
  }
}
