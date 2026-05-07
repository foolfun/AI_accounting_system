# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

AI 驱动的个人记账应用，基于 Next.js 16.2.5 (App Router) + React 19.2.4。SQLite 数据库（better-sqlite3 + Drizzle ORM），通过 DeepSeek API（Anthropic 兼容协议）实现自然语言记账。单用户 MVP，无认证系统。

## 常用命令

```bash
npm run dev      # 启动开发服务器
npm run build    # 生产构建
npm run lint     # ESLint 检查
```

## 关键架构

### 数据库（SQLite，无迁移系统）

数据库文件：`data/accounting.db`。使用 `src/lib/db.ts` 中的原始 SQL `CREATE TABLE IF NOT EXISTS` 管理 schema（无 drizzle.config.ts）。首次运行时自动建表并初始化种子数据。

5 张表：`categories`、`transactions`、`annual_budgets`、`category_budgets`、`chat_messages`。所有主键为 UUID 字符串，时间戳为 ISO-8601 文本格式。Schema 定义在 `src/lib/db-schema.ts`（Drizzle）和 `src/lib/db.ts`（原始 SQL）两处。

### 懒初始化模式

每个 API 路由文件维护一个模块级 `let initialized = false` 标志，首次调用时执行 `initDatabase()`。没有应用级启动钩子。

### AI 安全架构

AI 输出结构化 JSON，但**绝不直接操作数据库**。`POST /api/chat` 中的 `executeIntent()` 函数是所有 AI 操作的唯一入口，负责验证并执行解析后的意图。系统提示词（`src/lib/ai-service.ts`，约 160 行）定义了 8 种意图类型，并包含中文关键词到分类的映射表。

### 自动创建分类

当 AI 将支出归类到不存在的分类时，`ensureCategory()` 会自动创建分类并智能匹配图标和颜色。用户无需手动预建分类。

### API 路由结构（REST 风格）

| 路由 | 方法 | 用途 |
|------|------|------|
| `/api/chat` | POST | AI 对话核心端点 |
| `/api/transactions` | GET/POST | 交易列表/创建 |
| `/api/transactions/[id]` | PUT/DELETE | 更新/删除交易 |
| `/api/categories` | GET/POST | 分类列表/创建 |
| `/api/categories/[id]` | PUT/DELETE | 更新/删除分类 |
| `/api/budgets` | POST | 创建/更新年度预算 |
| `/api/budgets/[year]` | GET | 查询年度预算汇总 |

### 组件架构

全部为客户端组件（`"use client"`），使用 React hooks 管理状态，无全局状态库。Sidebar 为固定左侧导航栏，各页面通过 API 获取数据。

### UI 技术栈

Tailwind CSS v4（`@import "tailwindcss"` + `@theme inline`），自定义组件（非 shadcn/ui），`clsx` + `tailwind-merge` 合并类名。

## 注意事项

- `better-sqlite3` 是原生模块，`next.config.ts` 中已配置 `serverExternalPackages: ["better-sqlite3"]`
- `@anthropic-ai/sdk` 在依赖中但代码实际使用 `fetch()` 调用 DeepSeek API
- `src/components/ui/` 目录为空，预留作未来使用
