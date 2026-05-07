"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "首页总览", icon: "📊" },
  { href: "/chat", label: "AI 记账", icon: "💬" },
  { href: "/transactions", label: "花销明细", icon: "📋" },
  { href: "/budget", label: "预算管理", icon: "💰" },
  { href: "/categories", label: "分类管理", icon: "🏷️" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-[var(--sidebar-bg)] text-[var(--sidebar-fg)] flex flex-col h-full shrink-0">
      <div className="p-5 border-b border-white/10">
        <h1 className="text-lg font-bold tracking-wide">AI 记账</h1>
        <p className="text-xs text-white/50 mt-0.5">智能财务管理</p>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-white/15 text-white font-medium"
                  : "text-white/65 hover:bg-white/8 hover:text-white"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/10 text-xs text-white/40">
        MVP v1.0
      </div>
    </aside>
  );
}
