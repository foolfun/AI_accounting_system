"use client";

import { useState, useRef, useEffect } from "react";
import { ChatInput } from "@/components/ChatInput";
import { ChatMessage } from "@/components/ChatMessage";
import type { ChatMessage as ChatMessageType, ParsedResult } from "@/types";

const examples = [
  { icon: "🍜", text: "今天午饭花了 42 元" },
  { icon: "🚕", text: "昨天打车 56" },
  { icon: "💰", text: "今年日用品预算 12000" },
  { icon: "📊", text: "查看今年预算使用情况" },
  { icon: "🔍", text: "查看本月娱乐支出" },
  { icon: "🏷️", text: "新增一个餐饮分类" },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (loading) return;
    setLoading(true);

    const userMsg: ChatMessageType = {
      id: "temp-" + Date.now(),
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();

      const assistantMsg: ChatMessageType = {
        id: data.assistantMessage?.id || "resp-" + Date.now(),
        role: "assistant",
        content: data.assistantMessage?.content || "处理完成",
        intent: data.assistantMessage?.intent,
        parsedResult: data.parsed ? JSON.stringify(data.parsed) : undefined,
        createdAt: data.assistantMessage?.createdAt || new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessageType = {
        id: "err-" + Date.now(),
        role: "assistant",
        content: "抱歉，发送失败。请检查网络连接后重试。",
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-gray-100 bg-white/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-sm shadow-blue-200">
            AI
          </div>
          <div>
            <h1 className="text-base font-semibold text-gray-900">AI 记账助手</h1>
            <p className="text-xs text-gray-400">用自然语言记账，说人话就行</p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-gradient-to-b from-gray-50/50 to-white">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            {/* Hero */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-400 via-indigo-400 to-purple-500 flex items-center justify-center text-4xl shadow-lg shadow-blue-200/50 mb-6 animate-fade-in">
              💬
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-1.5">开始记账吧</h2>
            <p className="text-sm text-gray-400 mb-8">用对话记录每一笔花销，自动分类，轻松管理</p>

            {/* Example cards */}
            <div className="grid grid-cols-2 gap-2.5 w-full max-w-md">
              {examples.map((ex) => (
                <button
                  key={ex.text}
                  onClick={() => handleSend(ex.text)}
                  disabled={loading}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white border border-gray-100 text-left text-sm text-gray-600 hover:border-blue-200 hover:shadow-sm hover:-translate-y-0.5 disabled:opacity-50 transition-all duration-200 shadow-sm"
                >
                  <span className="text-lg shrink-0">{ex.icon}</span>
                  <span className="truncate">{ex.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => {
          let parsed: ParsedResult | null = null;
          if (msg.parsedResult) {
            try { parsed = JSON.parse(msg.parsedResult); } catch { /* */ }
          }
          return (
            <ChatMessage
              key={msg.id}
              role={msg.role}
              content={msg.content}
              parsed={parsed}
              createdAt={msg.createdAt}
            />
          );
        })}

        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={loading} />
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-2.5 animate-fade-in px-1">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm">
        AI
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" />
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0.1s" }} />
          <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: "0.2s" }} />
        </div>
      </div>
    </div>
  );
}
