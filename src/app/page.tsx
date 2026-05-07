"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BudgetCard } from "@/components/BudgetCard";
import type { BudgetSummary, Transaction } from "@/types";
import { formatCurrency, currentYear } from "@/lib/utils";

export default function HomePage() {
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [recentTxs, setRecentTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const year = currentYear();
        const [budgetRes, txRes] = await Promise.all([
          fetch(`/api/budgets/${year}`),
          fetch(`/api/transactions?start_date=${year}-01-01&end_date=${year}-12-31`),
        ]);
        const budgetData = await budgetRes.json();
        const txData = await txRes.json();

        setSummary(budgetData);
        setRecentTxs(txData.items?.slice(0, 5) || []);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const year = currentYear();

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">首页总览</h1>
          <p className="text-sm text-gray-500 mt-0.5">{year} 年财务概览</p>
        </div>
        <Link
          href="/chat"
          className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-xl hover:bg-[var(--primary-hover)] transition-colors"
        >
          AI 记账
        </Link>
      </div>

      <BudgetCard summary={summary} loading={loading} />

      {/* Recent Transactions */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-700">最近消费</h2>
          <Link href="/transactions" className="text-sm text-[var(--primary)] hover:underline">
            查看全部 →
          </Link>
        </div>

        {recentTxs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
            <div className="text-3xl mb-2">📝</div>
            <p className="text-gray-400 text-sm">暂无消费记录</p>
            <Link href="/chat" className="text-sm text-[var(--primary)] mt-1 inline-block hover:underline">
              去记一笔 →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {recentTxs.map((tx, i) => (
              <div
                key={tx.id}
                className={`flex items-center justify-between px-5 py-3.5 ${
                  i < recentTxs.length - 1 ? "border-b border-gray-50" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{tx.categoryIcon || "📦"}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-700">
                      {tx.note || tx.categoryName || "未分类"}
                    </div>
                    <div className="text-xs text-gray-400">
                      {tx.transactionDate} · {tx.categoryName}
                    </div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-red-500">
                  -{formatCurrency(tx.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      {summary && summary.totalBudget && (
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="text-xs text-gray-400 mb-1">日均预算</div>
            <div className="text-lg font-bold text-gray-800">
              {formatCurrency(Math.round(summary.totalBudget / 365))}
              <span className="text-xs text-gray-400 font-normal"> / 天</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              已过 {new Date().getMonth() + 1} 个月
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="text-xs text-gray-400 mb-1">月均支出</div>
            <div className="text-lg font-bold text-gray-800">
              {formatCurrency(Math.round(summary.totalSpent / Math.max(1, new Date().getMonth() + 1)))}
              <span className="text-xs text-gray-400 font-normal"> / 月</span>
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {((summary.totalSpent / summary.totalBudget) * 100).toFixed(1)}% 预算已使用
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
