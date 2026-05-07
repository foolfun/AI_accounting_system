import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";
import { initDatabase } from "@/lib/db";
import { transactions, categories } from "@/lib/db-schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { today, currentYear } from "@/lib/utils";

let initialized = false;

export async function GET(request: NextRequest) {
  if (!initialized) { initDatabase(); initialized = true; }

  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("start_date") || `${currentYear()}-01-01`;
    const endDate = searchParams.get("end_date") || `${currentYear()}-12-31`;
    const categoryId = searchParams.get("category_id");
    const keyword = searchParams.get("keyword");
    const sort = searchParams.get("sort") || "date-desc";

    const conditions = [
      gte(transactions.transactionDate, startDate),
      lte(transactions.transactionDate, endDate),
    ];
    if (categoryId) conditions.push(eq(transactions.categoryId, categoryId));

    let filtered = await db.select().from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.transactionDate)).all();

    if (keyword) {
      filtered = filtered.filter((t) => t.note.includes(keyword) || t.rawText.includes(keyword));
    }

    // Sort
    if (sort === "amount-desc") {
      filtered.sort((a, b) => b.amount - a.amount);
    } else if (sort === "amount-asc") {
      filtered.sort((a, b) => a.amount - b.amount);
    }

    // Enrich with category info
    const allCats = await db.select().from(categories).all();
    const catMap = new Map(allCats.map((c) => [c.id, c]));

    const enriched = filtered.map((t) => {
      const cat = t.categoryId ? catMap.get(t.categoryId) : null;
      return {
        ...t,
        categoryName: cat?.name || "未分类",
        categoryIcon: cat?.icon || "📦",
        categoryColor: cat?.color || "#6b7280",
      };
    });

    return NextResponse.json({ items: enriched, total: enriched.length });
  } catch (error) {
    console.error("GET /api/transactions error:", error);
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!initialized) { initDatabase(); initialized = true; }

  try {
    const body = await request.json();
    const now = new Date().toISOString();

    const id = uuid();
    await db.insert(transactions).values({
      id,
      type: body.type || "expense",
      amount: body.amount,
      categoryId: body.category_id || body.categoryId || null,
      transactionDate: body.transaction_date || body.transactionDate || today(),
      note: body.note || "",
      source: body.source || "manual",
      rawText: body.raw_text || body.rawText || "",
      aiConfidence: body.ai_confidence ?? body.aiConfidence ?? null,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json({ id, message: "创建成功" }, { status: 201 });
  } catch (error) {
    console.error("POST /api/transactions error:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
