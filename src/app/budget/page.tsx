"use client";

import { useEffect, useState } from "react";
import { BudgetCard } from "@/components/BudgetCard";
import type { BudgetSummary, Category } from "@/types";
import { formatCurrency, getStatusLabel, currentYear } from "@/lib/utils";

const STATUS_BG_CLASS: Record<string, string> = {
  normal: "bg-green-50 text-green-600",
  warning: "bg-blue-50 text-blue-600",
  danger: "bg-orange-50 text-orange-600",
  over: "bg-red-50 text-red-600",
};

export default function BudgetPage() {
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [totalBudget, setTotalBudget] = useState("");
  const [catBudgets, setCatBudgets] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const year = currentYear();

  useEffect(() => {
    async function fetchData() {
      try {
        const [budgetRes, catRes] = await Promise.all([
          fetch(`/api/budgets/${year}`),
          fetch("/api/categories"),
        ]);
        const budgetData = await budgetRes.json();
        const catData = await catRes.json();
        setSummary(budgetData);
        setCategories(catData.items || []);

        // Pre-fill form with existing data
        if (budgetData.totalBudget) setTotalBudget(String(budgetData.totalBudget));
        const existing: Record<string, string> = {};
        (budgetData.categories || []).forEach((c: { categoryId: string; budget: number }) => {
          existing[c.categoryId] = String(c.budget);
        });
        setCatBudgets(existing);
      } catch (err) {
        console.error("Failed to fetch budget:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [year]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = { year };
      if (totalBudget) body.totalBudget = parseFloat(totalBudget);

      const cbs = Object.entries(catBudgets)
        .filter(([, amt]) => amt && parseFloat(amt) > 0)
        .map(([catId, amt]) => ({
          categoryId: catId,
          amount: parseFloat(amt),
        }));
      if (cbs.length > 0) body.categoryBudgets = cbs;

      await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      // Refresh
      const res = await fetch(`/api/budgets/${year}`);
      const data = await res.json();
      setSummary(data);
      setShowForm(false);
    } catch (err) {
      console.error("Save budget failed:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">预算管理</h1>
          <p className="text-sm text-gray-500 mt-0.5">{year} 年度预算</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-xl hover:bg-[var(--primary-hover)] transition-colors"
        >
          {showForm ? "取消" : "设置预算"}
        </button>
      </div>

      {/* Budget Setting Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-700 mb-4">设置 {year} 年预算</h2>

          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-1">年度总预算</label>
            <input
              type="number"
              value={totalBudget}
              onChange={(e) => setTotalBudget(e.target.value)}
              placeholder="例如：60000"
              className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm text-gray-600 mb-2">分类预算</label>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <div key={cat.id} className="flex items-center gap-2">
                  <span className="text-sm shrink-0">{cat.icon} {cat.name}</span>
                  <input
                    type="number"
                    value={catBudgets[cat.id] || ""}
                    onChange={(e) => setCatBudgets({ ...catBudgets, [cat.id]: e.target.value })}
                    placeholder="金额"
                    className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 bg-[var(--primary)] text-white text-sm font-medium rounded-xl hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors"
          >
            {saving ? "保存中..." : "保存预算设置"}
          </button>
        </div>
      )}

      {/* Budget Summary */}
      {loading ? (
        <BudgetCard summary={null} loading />
      ) : (
        <BudgetCard summary={summary} />
      )}

      {/* Category Detail Table */}
      {summary && summary.categories.length > 0 && (
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50">
            <h2 className="text-base font-semibold text-gray-700">分类预算明细表</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="py-3 px-4 text-left font-medium text-gray-500 text-xs">分类</th>
                <th className="py-3 px-4 text-right font-medium text-gray-500 text-xs">年预算</th>
                <th className="py-3 px-4 text-right font-medium text-gray-500 text-xs">已支出</th>
                <th className="py-3 px-4 text-right font-medium text-gray-500 text-xs">剩余</th>
                <th className="py-3 px-4 text-right font-medium text-gray-500 text-xs">剩余占比</th>
                <th className="py-3 px-4 text-center font-medium text-gray-500 text-xs">状态</th>
              </tr>
            </thead>
            <tbody>
              {summary.categories.map((cat) => (
                <tr key={cat.categoryId} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center gap-2">
                      <span>{cat.categoryIcon}</span>
                      <span className="font-medium text-gray-700">{cat.categoryName}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">{formatCurrency(cat.budget)}</td>
                  <td className="py-3 px-4 text-right text-red-500">{formatCurrency(cat.spent)}</td>
                  <td className={`py-3 px-4 text-right ${cat.remaining < 0 ? "text-red-500" : "text-green-600"}`}>
                    {formatCurrency(cat.remaining)}
                  </td>
                  <td className={`py-3 px-4 text-right font-medium ${cat.remainingRatio < 0 ? "text-red-500" : cat.remainingRatio <= 0.1 ? "text-orange-500" : "text-gray-600"}`}>
                    {(cat.remainingRatio * 100).toFixed(1)}%
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BG_CLASS[cat.status]}`}>
                      {getStatusLabel(cat.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
