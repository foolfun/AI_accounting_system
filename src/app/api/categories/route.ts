import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";
import { initDatabase } from "@/lib/db";
import { categories } from "@/lib/db-schema";
import { eq } from "drizzle-orm";

let initialized = false;

export async function GET() {
  if (!initialized) { initDatabase(); initialized = true; }

  try {
    const all = await db.select().from(categories).all();
    return NextResponse.json({ items: all });
  } catch (error) {
    console.error("GET /api/categories error:", error);
    return NextResponse.json({ error: "查询失败" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!initialized) { initDatabase(); initialized = true; }

  try {
    const body = await request.json();
    const now = new Date().toISOString();

    const id = uuid();
    await db.insert(categories).values({
      id,
      name: body.name,
      type: body.type || "expense",
      icon: body.icon || "📦",
      color: body.color || "#6b7280",
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    });

    const created = await db.select().from(categories).where(eq(categories.id, id)).get();
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("POST /api/categories error:", error);
    return NextResponse.json({ error: "创建失败" }, { status: 500 });
  }
}
