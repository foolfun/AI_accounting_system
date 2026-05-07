"use client";

import { useEffect, useState } from "react";
import type { Category } from "@/types";

const DEFAULT_ICONS = ["🍽️", "🚗", "🛍️", "🧴", "🏠", "🎮", "🏥", "📚", "✈️", "🎁", "📦"];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("📦");
  const [saving, setSaving] = useState(false);

  const fetchCategories = async () => {
    try {
      const res = await fetch("/api/categories");
      const data = await res.json();
      setCategories(data.items || []);
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openNew = () => {
    setEditingCat(null);
    setName("");
    setIcon("📦");
    setShowForm(true);
  };

  const openEdit = (cat: Category) => {
    setEditingCat(cat);
    setName(cat.name);
    setIcon(cat.icon);
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);

    try {
      if (editingCat) {
        await fetch(`/api/categories/${editingCat.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), icon }),
        });
      } else {
        await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), icon, type: "expense" }),
        });
      }
      await fetchCategories();
      setShowForm(false);
    } catch (err) {
      console.error("Save category failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (cat: Category) => {
    if (cat.isDefault) {
      alert("默认分类不可删除");
      return;
    }
    if (!confirm(`确定删除分类"${cat.name}"吗？`)) return;

    try {
      await fetch(`/api/categories/${cat.id}`, { method: "DELETE" });
      await fetchCategories();
    } catch (err) {
      console.error("Delete category failed:", err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">分类管理</h1>
          <p className="text-sm text-gray-500 mt-0.5">管理消费分类</p>
        </div>
        <button
          onClick={openNew}
          className="px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-xl hover:bg-[var(--primary-hover)] transition-colors"
        >
          新增分类
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {editingCat ? "编辑分类" : "新增分类"}
            </h2>

            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">名称</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：宠物、数码"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
                autoFocus
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">图标</label>
              <div className="flex flex-wrap gap-2">
                {DEFAULT_ICONS.map((ic) => (
                  <button
                    key={ic}
                    onClick={() => setIcon(ic)}
                    className={`w-9 h-9 text-lg rounded-lg flex items-center justify-center transition-colors ${
                      icon === ic ? "bg-blue-100 ring-2 ring-[var(--primary)]" : "bg-gray-50 hover:bg-gray-100"
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !name.trim()}
                className="flex-1 py-2.5 bg-[var(--primary)] text-white text-sm font-medium rounded-xl hover:bg-[var(--primary-hover)] disabled:opacity-50 transition-colors"
              >
                {saving ? "保存中..." : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category List */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-32 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 bg-gray-100 rounded" />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {categories.map((cat, i) => (
            <div
              key={cat.id}
              className={`flex items-center justify-between px-5 py-3.5 ${
                i < categories.length - 1 ? "border-b border-gray-50" : ""
              } hover:bg-gray-50/50 transition-colors`}
            >
              <div className="flex items-center gap-4">
                <span className="text-xl">{cat.icon}</span>
                <div>
                  <div className="text-sm font-medium text-gray-700">
                    {cat.name}
                    {cat.isDefault && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-400">默认</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    {cat.type === "expense" ? "支出" : "收入"}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEdit(cat)}
                  className="text-xs text-gray-400 hover:text-[var(--primary)] transition-colors"
                >
                  编辑
                </button>
                {!cat.isDefault && (
                  <button
                    onClick={() => handleDelete(cat)}
                    className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                  >
                    删除
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
