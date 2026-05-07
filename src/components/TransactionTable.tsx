"use client";

import { useState } from "react";
import type { Transaction } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface TransactionTableProps {
  transactions: Transaction[];
  onEdit: (tx: Transaction) => void;
  onDelete: (tx: Transaction) => void;
}

export function TransactionTable({ transactions, onEdit, onDelete }: TransactionTableProps) {
  const [sortField, setSortField] = useState<keyof Transaction>("transactionDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = [...transactions].sort((a, b) => {
    const aVal = a[sortField];
    const bVal = b[sortField];
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;

    let cmp = 0;
    if (typeof aVal === "number" && typeof bVal === "number") {
      cmp = aVal - bVal;
    } else {
      cmp = String(aVal).localeCompare(String(bVal));
    }
    return sortDir === "asc" ? cmp : -cmp;
  });

  const handleSort = (field: keyof Transaction) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <div className="text-4xl mb-3">📭</div>
        <p>暂无消费记录</p>
        <p className="text-sm mt-1">去 AI 记账页面开始记录吧</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm table-fixed">
        <thead>
          <tr className="border-b border-gray-100">
            <Th label="时间" field="transactionDate" current={sortField} dir={sortDir} onClick={() => handleSort("transactionDate")} className="text-left w-[110px]" />
            <Th label="分类" field="categoryName" current={sortField} dir={sortDir} onClick={() => handleSort("categoryName")} className="text-center" />
            <Th label="金额" field="amount" current={sortField} dir={sortDir} onClick={() => handleSort("amount")} className="text-right w-[100px]" />
            <Th label="备注" field="note" current={sortField} dir={sortDir} onClick={() => handleSort("note")} className="text-center" />
            <th className="py-3 px-2 text-right font-medium text-gray-500 text-xs w-[88px]">操作</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((tx) => (
            <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
              <td className="py-3 px-2 text-gray-600">{tx.transactionDate}</td>
              <td className="py-3 px-2 text-center">
                <span className="inline-flex items-center gap-1.5 justify-center">
                  <span>{tx.categoryIcon || "📦"}</span>
                  <span>{tx.categoryName || "未分类"}</span>
                </span>
              </td>
              <td className={`py-3 px-2 text-right font-medium ${tx.type === "income" ? "text-green-600" : "text-red-500"}`}>
                {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
              </td>
              <td className="py-3 px-2 text-gray-500 max-w-[200px] truncate text-center">{tx.note || "-"}</td>
              <td className="py-3 px-2 text-right whitespace-nowrap">
                <button
                  onClick={() => onEdit(tx)}
                  className="text-xs text-gray-400 hover:text-[var(--primary)] mr-2 transition-colors"
                >
                  编辑
                </button>
                <button
                  onClick={() => onDelete(tx)}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  删除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Th({
  label, field, current, dir, onClick, className = "",
}: {
  label: string;
  field: string;
  current: string;
  dir: string;
  onClick: () => void;
  className?: string;
}) {
  const isActive = current === field;
  return (
    <th
      className={`py-3 px-2 font-medium text-gray-500 text-xs cursor-pointer hover:text-gray-700 select-none ${className}`}
      onClick={onClick}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive && <span className="text-[10px]">{dir === "asc" ? "↑" : "↓"}</span>}
      </span>
    </th>
  );
}
