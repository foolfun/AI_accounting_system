import { BudgetProgressBar } from "./BudgetProgressBar";
import type { BudgetSummary, CategoryBudgetSummary } from "@/types";
import { formatCurrency, getStatusFromRatio, currentYear } from "@/lib/utils";

interface BudgetCardProps {
  summary: BudgetSummary | null;
  loading?: boolean;
}

export function BudgetCard({ summary, loading }: BudgetCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm animate-pulse">
        <div className="h-5 bg-gray-200 rounded w-32 mb-4" />
        <div className="h-8 bg-gray-200 rounded w-48 mb-4" />
        <div className="h-4 bg-gray-200 rounded w-full mb-2" />
        <div className="h-3 bg-gray-200 rounded w-2/3" />
      </div>
    );
  }

  if (!summary || (!summary.totalBudget && summary.categories.length === 0)) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm text-center">
        <div className="text-3xl mb-2">💰</div>
        <p className="text-gray-500 text-sm">还没有设置 {summary?.year || currentYear()} 年预算</p>
        <p className="text-gray-400 text-xs mt-1">去 AI 记账页面说"今年总预算 60000"来设置</p>
      </div>
    );
  }

  const overallStatus = getStatusFromRatio(summary.remainingRatio);

  return (
    <div className="space-y-4">
      {/* Overall budget card */}
      {summary.totalBudget && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">{summary.year} 年预算总览</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <div className="text-xs text-gray-400 mb-0.5">总预算</div>
              <div className="text-xl font-bold text-gray-800">{formatCurrency(summary.totalBudget)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-0.5">已支出</div>
              <div className="text-xl font-bold text-red-500">{formatCurrency(summary.totalSpent)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-0.5">剩余</div>
              <div className={`text-xl font-bold ${summary.remainingBudget < 0 ? "text-red-500" : "text-green-600"}`}>
                {formatCurrency(summary.remainingBudget)}
              </div>
            </div>
          </div>
          <BudgetProgressBar
            budget={summary.totalBudget}
            spent={summary.totalSpent}
            remaining={summary.remainingBudget}
            remainingRatio={summary.remainingRatio}
            status={overallStatus}
          />
        </div>
      )}

      {/* Category budget list */}
      {summary.categories.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-500 mb-4">分类预算详情</h3>
          <div className="space-y-5">
            {summary.categories.map((cat) => (
              <CategoryBudgetRow key={cat.categoryId} cat={cat} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CategoryBudgetRow({ cat }: { cat: CategoryBudgetSummary }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-lg">{cat.categoryIcon}</span>
          <span className="text-sm font-medium text-gray-700">{cat.categoryName}</span>
        </div>
        <div className="text-xs text-gray-400">
          预算 {formatCurrency(cat.budget)} / 已用 {formatCurrency(cat.spent)}
        </div>
      </div>
      <BudgetProgressBar
        budget={cat.budget}
        spent={cat.spent}
        remaining={cat.remaining}
        remainingRatio={cat.remainingRatio}
        status={cat.status}
        showLabel={false}
      />
    </div>
  );
}
