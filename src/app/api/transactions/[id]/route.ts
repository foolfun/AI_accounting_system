import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { initDatabase } from "@/lib/db";
import { transactions } from "@/lib/db-schema";
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
    if (body.type !== undefined) updateData.type = body.type;
    if (body.amount !== undefined) updateData.amount = body.amount;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;
    if (body.transactionDate !== undefined) updateData.transactionDate = body.transactionDate;
    if (body.note !== undefined) updateData.note = body.note;

    await db.update(transactions).set(updateData).where(eq(transactions.id, id));

    return NextResponse.json({ id, message: "修改成功" });
  } catch (error) {
    console.error("PUT /api/transactions error:", error);
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
    await db.delete(transactions).where(eq(transactions.id, id));
    return NextResponse.json({ id, message: "删除成功" });
  } catch (error) {
    console.error("DELETE /api/transactions error:", error);
    return NextResponse.json({ error: "删除失败" }, { status: 500 });
  }
}
