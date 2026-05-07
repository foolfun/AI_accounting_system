import { NextRequest, NextResponse } from "next/server";
import { v4 as uuid } from "uuid";
import { db } from "@/lib/db";
import { initDatabase, smartIcon, randomColor } from "@/lib/db";
import { transactions, chatMessages, categories, annualBudgets, categoryBudgets } from "@/lib/db-schema";
import { parseUserMessage, buildResponse } from "@/lib/ai-service";
import { getStatusFromRatio, today, currentYear } from "@/lib/utils";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";

let initialized = false;

export async function POST(request: NextRequest) {
  if (!initialized) {
    initDatabase();
    initialized = true;
  }

  try {
    const { message } = await request.json();
    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "消息不能为空" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const todayStr = today();

    // Save user message
    const userMsgId = uuid();
    await db.insert(chatMessages).values({
      id: userMsgId,
      role: "user",
      content: message,
      createdAt: now,
    });

    // Get all categories for the AI
    const allCategories = await db.select().from(categories).all();
    const categoryMap = new Map(allCategories.map((c) => [c.name, c]));

    // Parse with AI
    const parsed = await parseUserMessage({
      message,
      categories: allCategories.map((c) => ({ id: c.id, name: c.name })),
    });

    let responseText = "";

    // Handle clarification needed
    if (parsed.needClarification && parsed.clarificationQuestion) {
      responseText = parsed.clarificationQuestion;
    } else {
      // Execute based on intent
      responseText = await executeIntent(parsed, allCategories, categoryMap, todayStr, now, userMsgId);
    }

    // Save assistant message
    const assistantMsgId = uuid();
    await db.insert(chatMessages).values({
      id: assistantMsgId,
      role: "assistant",
      content: responseText,
      intent: (parsed.intent as string) || null,
      parsedResult: JSON.stringify(parsed),
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      userMessage: { id: userMsgId, role: "user", content: message, createdAt: now },
      assistantMessage: {
        id: assistantMsgId,
        role: "assistant",
        content: responseText,
        intent: parsed.intent || null,
        parsedResult: parsed,
        createdAt: new Date().toISOString(),
      },
      parsed,
    });
  } catch (error) {
    console.error("Chat error:", error);
    const fallbackId = uuid();
    const fallbackMsg = '抱歉，处理出错了。请稍后再试，或尝试更简单的表达，比如“今天午饭花了 42 元”。';

    try {
      await db.insert(chatMessages).values({
        id: fallbackId,
        role: "assistant",
        content: fallbackMsg,
        createdAt: new Date().toISOString(),
      });
    } catch (_) { /* ignore */ }

    return NextResponse.json({
      userMessage: null,
      assistantMessage: {
        id: fallbackId,
        role: "assistant",
        content: fallbackMsg,
        intent: null,
        parsedResult: null,
        createdAt: new Date().toISOString(),
      },
      parsed: { intent: "error" },
    });
  }
}

async function executeIntent(
  parsed: Record<string, unknown>,
  allCategories: Array<typeof categories.$inferSelect>,
  categoryMap: Map<string, typeof categories.$inferSelect>,
  todayStr: string,
  now: string,
  userMsgId: string
): Promise<string> {
  const intent = parsed.intent as string;
  const relatedIds: string[] = [];

  switch (intent) {
    case "create_expense":
    case "create_income": {
      const txs = (parsed.transactions as Array<Record<string, unknown>>) || [];
      if (txs.length === 0) {
        // Single transaction from direct fields
        const amount = parsed.amount as number;
        const categoryName = (parsed.category as string) || "其他";
        const note = (parsed.note as string) || "";
        const date = (parsed.date as string) || todayStr;
        const confidence = (parsed.confidence as number) || 0.8;

        if (!amount || amount <= 0) {
          return "请问这笔支出的金额是多少？";
        }

        const cat = await ensureCategory(categoryName, allCategories, categoryMap, now);
        const txId = uuid();
        await db.insert(transactions).values({
          id: txId,
          type: intent === "create_income" ? "income" : "expense",
          amount,
          categoryId: cat.id,
          transactionDate: date,
          note,
          source: "ai",
          rawText: "",
          aiConfidence: confidence,
          createdAt: now,
          updatedAt: now,
        });
        relatedIds.push(txId);
        break;
      }

      for (const t of txs) {
        const amount = t.amount as number;
        const categoryName = (t.category as string) || "其他";
        const note = (t.note as string) || "";
        const date = (t.date as string) || todayStr;

        if (!amount || amount <= 0) continue;

        const cat = await ensureCategory(categoryName, allCategories, categoryMap, now);
        const txId = uuid();
        await db.insert(transactions).values({
          id: txId,
          type: intent === "create_income" ? "income" : "expense",
          amount,
          categoryId: cat.id,
          transactionDate: date,
          note,
          source: "ai",
          rawText: "",
          aiConfidence: 0.85,
          createdAt: now,
          updatedAt: now,
        });
        relatedIds.push(txId);
      }
      break;
    }

    case "set_budget": {
      const year = (parsed.year as number) || currentYear();
      const totalBudget = parsed.totalBudget as number | undefined;
      const catBudgets = (parsed.categoryBudgets as Array<Record<string, unknown>>) || [];

      // Check existing budget for this year
      const existing = await db.select().from(annualBudgets).where(eq(annualBudgets.year, year)).get();
      let budgetId: string;

      if (existing) {
        budgetId = existing.id;
        await db.update(annualBudgets).set({
          totalBudget: totalBudget ?? existing.totalBudget,
          updatedAt: now,
        }).where(eq(annualBudgets.id, budgetId));
      } else {
        budgetId = uuid();
        await db.insert(annualBudgets).values({
          id: budgetId,
          year,
          totalBudget: totalBudget ?? null,
          currency: "CNY",
          createdAt: now,
          updatedAt: now,
        });
      }

      for (const cb of catBudgets) {
        const catName = cb.category as string;
        const catAmount = cb.amount as number;
        let cat = categoryMap.get(catName);

        // Create category if doesn't exist
        if (!cat) {
          cat = await db.select().from(categories).where(eq(categories.name, catName)).get();
        }
        if (!cat) {
          const newCatId = uuid();
          await db.insert(categories).values({
            id: newCatId,
            name: catName,
            type: "expense",
            icon: smartIcon(catName),
            color: randomColor(),
            isDefault: false,
            createdAt: now,
            updatedAt: now,
          });
          cat = { id: newCatId, name: catName } as typeof categories.$inferSelect;
          categoryMap.set(catName, cat);
        }

        // Upsert category budget
        const existingCb = await db.select().from(categoryBudgets).where(
          and(eq(categoryBudgets.annualBudgetId, budgetId), eq(categoryBudgets.categoryId, cat.id))
        ).get();

        if (existingCb) {
          await db.update(categoryBudgets).set({
            budgetAmount: catAmount,
            updatedAt: now,
          }).where(eq(categoryBudgets.id, existingCb.id));
        } else {
          await db.insert(categoryBudgets).values({
            id: uuid(),
            annualBudgetId: budgetId,
            categoryId: cat.id,
            budgetAmount: catAmount,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
      break;
    }

    case "query_budget": {
      const year = (parsed.year as number) || currentYear();
      const summary = await getBudgetSummary(year);
      if (!summary || (!summary.totalBudget && summary.categories.length === 0)) {
        return `${year} 年还没有设置预算。你可以说"${year}年总预算 60000"来设置。`;
      }

      let resp = "";
      if (summary.totalBudget) {
        resp += `${year} 年总预算 ${summary.totalBudget.toLocaleString()} 元，已支出 ${summary.totalSpent.toLocaleString()} 元，剩余 ${summary.remainingBudget.toLocaleString()} 元，剩余占比 ${(summary.remainingRatio * 100).toFixed(1)}%。`;
      }
      if (summary.categories.length > 0) {
        const lines = summary.categories.map(
          (c) => `${c.categoryIcon} ${c.categoryName}：预算 ${c.budget.toLocaleString()}，已支出 ${c.spent.toLocaleString()}，剩余 ${c.remaining.toLocaleString()}（${(c.remainingRatio * 100).toFixed(0)}%）`
        );
        resp += "\n\n" + lines.join("\n");
      }
      return resp;
    }

    case "query_transactions": {
      const query = (parsed.query as Record<string, string>) || {};
      const catName = query?.category;
      let catId: string | null = null;
      if (catName) {
        const cat = categoryMap.get(catName);
        catId = cat?.id || null;
      }

      let result;
      if (catId) {
        result = await db.select().from(transactions)
          .where(eq(transactions.categoryId, catId))
          .orderBy(desc(transactions.transactionDate))
          .limit(10).all();
      } else {
        result = await db.select().from(transactions)
          .orderBy(desc(transactions.transactionDate))
          .limit(10).all();
      }

      if (result.length === 0) {
        return catName ? `暂无"${catName}"分类的消费记录。` : "暂无消费记录。";
      }

      const lines = result.map((t, i) => {
        const cat = allCategories.find((c) => c.id === t.categoryId);
        return `${i + 1}. ${t.transactionDate} ${cat?.icon || ""}${cat?.name || "未知"} ${t.amount} 元${t.note ? ` (${t.note})` : ""}`;
      });
      return `最近${result.length}条记录：\n${lines.join("\n")}`;
    }

    case "update_transaction": {
      const target = (parsed.target as string) || "last";
      const updates = (parsed.updates as Record<string, string>) || {};

      // Find target transaction
      let tx;
      if (target === "last") {
        tx = await db.select().from(transactions).orderBy(desc(transactions.createdAt)).limit(1).get();
      } else {
        // Try to match by amount
        const amount = parseFloat(target);
        if (!isNaN(amount)) {
          tx = await db.select().from(transactions)
            .where(eq(transactions.amount, amount))
            .orderBy(desc(transactions.createdAt))
            .limit(1).get();
        }
      }

      if (!tx) return "没有找到可修改的记录。";

      const updateData: Record<string, unknown> = { updatedAt: now };

      if (updates.category) {
        const cat = findOrMatchCategory(updates.category, allCategories, categoryMap);
        if (cat) updateData.categoryId = cat.id;
      }
      if (updates.note !== undefined) updateData.note = updates.note;
      if (updates.amount) {
        const amt = parseFloat(updates.amount);
        if (!isNaN(amt) && amt > 0) updateData.amount = amt;
      }

      await db.update(transactions).set(updateData).where(eq(transactions.id, tx.id));
      relatedIds.push(tx.id);
      break;
    }

    case "delete_transaction": {
      const target = (parsed.target as string) || "last";
      let tx;
      if (target === "last") {
        tx = await db.select().from(transactions).orderBy(desc(transactions.createdAt)).limit(1).get();
      } else {
        const amount = parseFloat(target);
        if (!isNaN(amount)) {
          tx = await db.select().from(transactions)
            .where(eq(transactions.amount, amount))
            .orderBy(desc(transactions.createdAt))
            .limit(1).get();
        }
      }

      if (!tx) return "没有找到可删除的记录。";
      await db.delete(transactions).where(eq(transactions.id, tx.id));
      break;
    }

    case "create_category": {
      const catName = (parsed.category as string) || (parsed.name as string);
      if (!catName) return "请问新分类的名称是什么？";

      const existing = categoryMap.get(catName);
      if (existing) return `分类"${catName}"已存在。`;

      const newId = uuid();
      await db.insert(categories).values({
        id: newId,
        name: catName,
        type: "expense",
        icon: smartIcon(catName),
        color: randomColor(),
        isDefault: false,
        createdAt: now,
        updatedAt: now,
      });
      return `已创建新分类"${catName}"。`;
    }

    default:
      return '抱歉，我没理解你的意思。你可以试试：\n- “今天午饭花了 42 元”（记一笔）\n- “今年餐饮预算 12000”（设预算）\n- “查看今年预算”（查预算）\n- “查看本月餐饮支出”（查明细）';
  }

  // Update related transaction IDs for chat messages
  if (relatedIds.length > 0) {
    try {
      await db.update(chatMessages)
        .set({ relatedTransactionId: relatedIds[0] })
        .where(eq(chatMessages.id, userMsgId));
    } catch (_) { /* ignore */ }
  }

  return buildResponse(parsed);
}

function findOrMatchCategory(
  name: string,
  allCategories: Array<typeof categories.$inferSelect>,
  categoryMap: Map<string, typeof categories.$inferSelect>
): typeof categories.$inferSelect | undefined {
  const exact = categoryMap.get(name);
  if (exact) return exact;
  const fuzzy = allCategories.find((c) => name.includes(c.name) || c.name.includes(name));
  return fuzzy;
}

async function ensureCategory(
  categoryName: string,
  allCategories: Array<typeof categories.$inferSelect>,
  categoryMap: Map<string, typeof categories.$inferSelect>,
  now: string
): Promise<typeof categories.$inferSelect> {
  // Exact or fuzzy match
  const existing = findOrMatchCategory(categoryName, allCategories, categoryMap);
  if (existing) return existing;

  // Create new category
  const newId = uuid();
  const icon = smartIcon(categoryName);
  const color = randomColor();
  await db.insert(categories).values({
    id: newId,
    name: categoryName,
    type: "expense",
    icon,
    color,
    isDefault: false,
    createdAt: now,
    updatedAt: now,
  });

  const created = { id: newId, name: categoryName, icon, color } as typeof categories.$inferSelect;
  allCategories.push(created);
  categoryMap.set(categoryName, created);
  return created;
}

async function getBudgetSummary(year: number) {
  const annual = await db.select().from(annualBudgets).where(eq(annualBudgets.year, year)).get();
  if (!annual) return null;

  const catBudgets = await db.select().from(categoryBudgets).where(eq(categoryBudgets.annualBudgetId, annual.id)).all();
  const allCategories = await db.select().from(categories).all();
  const catMap = new Map(allCategories.map((c) => [c.id, c]));

  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;

  // Single aggregate query instead of N+1
  const spentByCategory = await db.select({
    categoryId: transactions.categoryId,
    total: sql<number>`SUM(${transactions.amount})`.as('total'),
  }).from(transactions)
    .where(and(
      gte(transactions.transactionDate, yearStart),
      lte(transactions.transactionDate, yearEnd),
      eq(transactions.type, "expense")
    ))
    .groupBy(transactions.categoryId)
    .all();

  const spentMap = new Map(spentByCategory.map((s) => [s.categoryId, s.total]));
  const totalSpent = spentByCategory.reduce((sum, s) => sum + s.total, 0);

  const categorySummaries = catBudgets.filter((cb): cb is typeof cb & { categoryId: string } => !!cb.categoryId).map((cb) => {
    const spent = spentMap.get(cb.categoryId) || 0;
    const cat = catMap.get(cb.categoryId);
    const remaining = cb.budgetAmount - spent;
    const ratio = cb.budgetAmount > 0 ? remaining / cb.budgetAmount : 0;

    return {
      categoryId: cb.categoryId,
      categoryName: cat?.name || "未知",
      categoryIcon: cat?.icon || "📦",
      categoryColor: cat?.color || "#6b7280",
      budget: cb.budgetAmount,
      spent,
      remaining,
      remainingRatio: ratio,
      status: getStatusFromRatio(ratio),
    };
  });

  const remainingBudget = (annual.totalBudget || 0) - totalSpent;
  const remainingRatio = (annual.totalBudget || 0) > 0 ? remainingBudget / (annual.totalBudget || 1) : 0;

  return {
    year,
    totalBudget: annual.totalBudget,
    totalSpent,
    remainingBudget,
    remainingRatio: Math.max(0, remainingRatio),
    categories: categorySummaries,
  };
}
