import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { initDatabase } from "@/lib/db";
import { categories } from "@/lib/db-schema";
import { eq } from "drizzle-orm";

let initialized = false;

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!initialized) { initDatabase(); initialized = true; }

  try {
    const { id } = await params;
    const body = await request.json();
    const now = new Date().toISOString();

    const updateData: Record<string, unknown> = { updatedAt: now };
    if (body.name !== undefined) updateData.name = body.name;
    if (body.type !== undefined) updateData.type = body.type;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.color !== undefined) updateData.color = body.color;

    await db.update(categories).set(updateData).where(eq(categories.id, id));

    const updated = await db.select().from(categories).where(eq(categories.id, id)).get();
    return NextResponse.json(updated);
  } catch (error) {
    console.error("PUT /api/categories error:", error);
    return NextResponse.json({ error: "修改失败" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!initialized) { initDatabase(); initialized = true; }

  try {
    const { id } = await params;
    await db.delete(categories).where(eq(categories.id, id));
    return NextResponse.json({ message: "删除成功" });
  } catch (error) {
    console.error("DELETE /api/categories error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
