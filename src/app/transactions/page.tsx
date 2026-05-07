"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { TransactionTable } from "@/components/TransactionTable";
import type { Transaction, Category } from "@/types";
import { currentYear } from "@/lib/utils";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    categoryId: "",
    startDate: `${currentYear()}-01-01`,
    endDate: `${currentYear()}-12-31`,
    keyword: "",
  });
  const debounceRef = useRef<NodeJS.Timeout>(null);

  // Edit modal state
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState({ date: "", categoryId: "", amount: "", note: "" });

  const fetchData = useCallback(async (f: typeof filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.categoryId) params.set("category_id", f.categoryId);
      if (f.startDate) params.set("start_date", f.startDate);
      if (f.endDate) params.set("end_date", f.endDate);
      if (f.keyword) params.set("keyword", f.keyword);

      const [txRes, catRes] = await Promise.all([
        fetch(`/api/transactions?${params.toString()}`),
        fetch("/api/categories"),
      ]);
      const txData = await txRes.json();
      const catData = await catRes.json();

      setTransactions(txData.items || []);
      setCategories(catData.items || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(filters); }, []);

  const updateFilter = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const delay = key === "keyword" ? 400 : 0;
    debounceRef.current = setTimeout(() => fetchData(newFilters), delay);
  };

  const openEdit = (tx: Transaction) => {
    setEditTx(tx);
    setEditForm({
      date: tx.transactionDate,
      categoryId: tx.categoryId || "",
      amount: String(tx.amount),
      note: tx.note,
    });
  };

  const saveEdit = async () => {
    if (!editTx) return;
    const amount = parseFloat(editForm.amount);
    if (!amount || amount <= 0) { alert("请输入有效的金额"); return; }

    try {
      const res = await fetch(`/api/transactions/${editTx.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionDate: editForm.date,
          categoryId: editForm.categoryId || null,
          amount,
          note: editForm.note,
        }),
      });
      if (res.ok) {
        setEditTx(null);
        fetchData(filters);
      } else {
        alert("修改失败，请重试");
      }
    } catch {
      alert("修改失败，请检查网络");
    }
  };

  const handleDelete = async (tx: Transaction) => {
    if (!confirm(`确定删除这条记录吗？\n${tx.transactionDate} ${tx.categoryName} ¥${tx.amount}`)) return;
    try {
      const res = await fetch(`/api/transactions/${tx.id}`, { method: "DELETE" });
      if (res.ok) {
        fetchData(filters);
      } else {
        const err = await res.json().catch(() => ({ error: "未知错误" }));
        alert("删除失败：" + (err.error || "请重试"));
      }
    } catch {
      alert("删除失败，请检查网络");
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">花销明细</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {loading ? "加载中..." : `共 ${transactions.length} 条记录`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4 shadow-sm">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-gray-400 mb-1">分类</label>
            <select
              value={filters.categoryId}
              onChange={(e) => updateFilter("categoryId", e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 bg-gray-50 cursor-pointer min-w-[140px]"
            >
              <option value="">全部分类</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">日期范围</label>
            <div className="flex items-center gap-1.5">
              <input type="date" value={filters.startDate} onChange={(e) => updateFilter("startDate", e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 bg-gray-50" />
              <span className="text-gray-300 text-xs">—</span>
              <input type="date" value={filters.endDate} onChange={(e) => updateFilter("endDate", e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 bg-gray-50" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">搜索</label>
            <input type="text" value={filters.keyword} onChange={(e) => updateFilter("keyword", e.target.value)}
              placeholder="关键词搜索..." className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 bg-gray-50 w-36" />
          </div>
          {(filters.categoryId || filters.keyword || filters.startDate !== `${currentYear()}-01-01` || filters.endDate !== `${currentYear()}-12-31`) && (
            <button onClick={() => {
              const cleared = { categoryId: "", startDate: `${currentYear()}-01-01`, endDate: `${currentYear()}-12-31`, keyword: "" };
              setFilters(cleared);
              fetchData(cleared);
            }} className="px-3 py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors">
              清除筛选
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <TransactionTable transactions={transactions} onEdit={openEdit} onDelete={handleDelete} />
      </div>

      {/* Edit Modal */}
      {editTx && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setEditTx(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-800 mb-5">编辑记录</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">日期</label>
                <input type="date" value={editForm.date}
                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">分类</label>
                <select value={editForm.categoryId}
                  onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200">
                  <option value="">未分类</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">金额</label>
                <input type="number" step="0.01" min="0.01" value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">备注</label>
                <input type="text" value={editForm.note}
                  onChange={(e) => setEditForm({ ...editForm, note: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-200" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditTx(null)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors">取消</button>
              <button onClick={saveEdit}
                className="flex-1 py-2.5 bg-[var(--primary)] text-white text-sm font-medium rounded-xl hover:bg-[var(--primary-hover)] transition-colors">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
