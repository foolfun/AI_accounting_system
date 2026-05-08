"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

const quickActions = [
  { label: "记一笔", icon: "✏️", text: "今天" },
  { label: "查预算", icon: "📊", text: "查看今年预算使用情况" },
  { label: "设预算", icon: "💰", text: "今年" },
];

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Refocus textarea when loading finishes
  useEffect(() => {
    if (!disabled && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [disabled]);

  const handleSend = () => {
    const msg = input.trim();
    if (!msg || disabled) return;
    onSend(msg);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="shrink-0 px-4 pb-4 pt-2 bg-gradient-to-t from-white via-white to-transparent">
      {/* Input bar */}
      <div className="flex items-end gap-2 bg-white rounded-2xl border border-gray-200 shadow-lg shadow-gray-200/50 px-3 py-2 focus-within:border-blue-300 focus-within:shadow-blue-100/50 focus-within:shadow-xl transition-all duration-200">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            const el = e.target;
            el.style.height = "auto";
            el.style.height = Math.min(el.scrollHeight, 120) + "px";
          }}
          onKeyDown={handleKeyDown}
          placeholder="说句话就能记账，比如：今天午饭花了 42 元"
          disabled={disabled}
          rows={1}
          className="flex-1 resize-none bg-transparent px-2 py-2 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none disabled:opacity-40"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !input.trim()}
          className="shrink-0 w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center hover:from-blue-600 hover:to-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 shadow-sm shadow-blue-200 active:scale-95"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1.333 1.467l13.334 6.2-13.334 6.2L5.6 8 1.333 1.467z" fill="currentColor" fillOpacity="0.9"/>
            <path d="M5.6 8l7.067-.333" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Quick actions */}
      <div className="flex gap-1.5 mt-2.5 justify-center">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => { setInput(action.text); textareaRef.current?.focus(); }}
            disabled={disabled}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
          >
            <span className="text-xs">{action.icon}</span>
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
