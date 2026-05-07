import { getStatusColor, getStatusLabel } from "@/lib/utils";

interface BudgetProgressBarProps {
  budget: number;
  spent: number;
  remaining: number;
  remainingRatio: number;
  status: "normal" | "warning" | "danger" | "over";
  showLabel?: boolean;
}

export function BudgetProgressBar({
  budget,
  spent,
  remaining,
  remainingRatio,
  status,
  showLabel = true,
}: BudgetProgressBarProps) {
  const color = getStatusColor(status);
  const displayRatio = Math.max(0, Math.min(1, remainingRatio));
  const isOver = status === "over";

  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-500">
          已支出 <span className="font-semibold text-gray-800">¥{spent.toLocaleString()}</span>
        </span>
        <span className={`font-medium ${isOver ? "text-red-500" : "text-gray-700"}`}>
          {isOver ? `超支 ¥${Math.abs(remaining).toLocaleString()}` : `剩余 ¥${remaining.toLocaleString()}`}
        </span>
      </div>
      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${displayRatio * 100}%`,
            backgroundColor: color,
          }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between text-xs mt-1">
          <span style={{ color }} className="font-medium">
            {isOver ? "已超支" : `${(remainingRatio * 100).toFixed(1)}% 剩余`}
          </span>
          <span style={{ color }}>{getStatusLabel(status)}</span>
        </div>
      )}
    </div>
  );
}
