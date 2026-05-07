import type { ParsedResult } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  parsed?: ParsedResult | null;
  createdAt: string;
}

export function ChatMessage({ role, content, parsed, createdAt }: ChatMessageProps) {
  const isUser = role === "user";
  const time = new Date(createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`flex gap-2.5 animate-fade-in ${isUser ? "flex-row-reverse" : ""}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-bold shadow-sm ${
          isUser
            ? "bg-gradient-to-br from-gray-300 to-gray-400 text-white"
            : "bg-gradient-to-br from-blue-400 to-indigo-600 text-white"
        }`}
      >
        {isUser ? "我" : "AI"}
      </div>

      <div className={`max-w-[78%] ${isUser ? "items-end" : "items-start"}`}>
        {/* Bubble */}
        <div
          className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl rounded-tr-md shadow-md shadow-blue-200/50"
              : "bg-white text-gray-700 rounded-2xl rounded-tl-md shadow-sm border border-gray-100"
          }`}
        >
          {content}
        </div>

        {/* Result cards */}
        {!isUser && parsed?.intent === "create_expense" && parsed.transactions?.length && (
          <div className="mt-2 p-3 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-100 rounded-xl text-sm shadow-sm">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-xs">✅</span>
              <span className="font-medium text-emerald-700 text-xs">已记录支出</span>
            </div>
            {parsed.transactions.map((t, i) => (
              <div key={i} className="flex items-center justify-between text-xs text-emerald-600 ml-5">
                <span>{t.category}{t.note ? ` · ${t.note}` : ""}</span>
                <span className="font-semibold">{formatCurrency(t.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {!isUser && parsed?.intent === "set_budget" && (
          <div className="mt-2 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl text-sm shadow-sm">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-xs">💰</span>
              <span className="font-medium text-blue-700 text-xs">预算已更新</span>
            </div>
            {parsed.totalBudget && (
              <div className="text-xs text-blue-600 ml-5">总预算：{formatCurrency(parsed.totalBudget)}</div>
            )}
            {parsed.categoryBudgets?.map((cb, i) => (
              <div key={i} className="text-xs text-blue-600 ml-5">
                {cb.category}：{formatCurrency(cb.amount)}
              </div>
            ))}
          </div>
        )}

        {!isUser && parsed?.intent === "create_category" && (
          <div className="mt-2 p-3 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100 rounded-xl text-sm shadow-sm">
            <div className="flex items-center gap-1.5">
              <span className="text-xs">🏷️</span>
              <span className="font-medium text-purple-700 text-xs">新分类已创建</span>
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className={`text-[11px] text-gray-300 mt-1 ${isUser ? "text-right" : "text-left"}`}>
          {time}
        </div>
      </div>
    </div>
  );
}
