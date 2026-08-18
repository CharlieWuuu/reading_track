"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { type LucideIcon } from "lucide-react";
import { createPortal } from "react-dom";
import { useCategories } from "@/lib/useCategories";
import { BookCategories, joinTags, splitTags } from "@/types/book";

/**
 * 仿 Notion 的分類選擇器：下拉選單裡就能新增、改名、刪除選項，
 * 不用特地跑去設定頁。選項存在試算表的「選項」工作表。
 *
 * `multiple` 的欄位（屬性）可以複選，多個值以頓號存在同一格裡，
 * 這樣 Sheet 那邊還是一欄，不用為了複選改表結構。
 */
export function CategorySelect({
  label,
  Icon,
  categoryKey,
  value,
  onChange,
  multiple = false,
}: {
  label: string;
  /** 跟詳細卡片同一個圖示，兩邊看起來才像同一個欄位 */
  Icon?: LucideIcon;
  categoryKey: keyof BookCategories;
  value: string;
  onChange: (value: string) => void;
  multiple?: boolean;
}) {
  const { categories, counts } = useCategories();
  // 舊版本的快取可能沒有這一組（例如剛加上的「平台」），兜底成空陣列
  const options = categories[categoryKey] ?? [];

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);

  // 點到別的地方就收起來（選單被送到 body 底下，所以兩塊都要檢查）
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  /**
   * 選單用 portal 送到 body 並固定定位。
   *
   * 編輯表單刻意每一頁都不給捲（外層是 overflow-hidden），選單如果留在原地
   * 會被裁掉一半；改成 fixed 就不受任何祖先的 overflow 影響。
   */
  useLayoutEffect(() => {
    if (!open) return;
    function measure() {
      const el = rootRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open]);

  const keyword = query.trim();
  const filtered = keyword
    ? options.filter((o) => o.toLowerCase().includes(keyword.toLowerCase()))
    : options;
  const canCreate = keyword.length > 0 && !options.includes(keyword);

  const selected = multiple ? splitTags(value) : value ? [value] : [];
  const isSelected = (option: string) => selected.includes(option);

  /** 單選＝取代並關閉；複選＝切換，選單留著讓使用者連續選 */
  function pick(option: string) {
    if (!multiple) {
      onChange(option);
      setQuery("");
      setOpen(false);
      return;
    }
    onChange(
      joinTags(isSelected(option) ? selected.filter((o) => o !== option) : [...selected, option]),
    );
    setQuery("");
  }

  /** 選項是從資料 group 出來的，所以「新增」就只是選一個還沒人用過的值 */
  function create() {
    if (!canCreate) return;
    pick(keyword);
  }

  return (
    <div ref={rootRef} className="relative">
      <label className="mb-1 flex items-center gap-1.5 text-sm font-medium">
        {Icon && (
          <Icon size={14} strokeWidth={1.5} className="shrink-0 text-gray-400" aria-hidden />
        )}
        {label}
      </label>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded border px-3 py-2 text-left text-sm"
      >
        {selected.length > 0 ? (
          <span className="flex flex-wrap gap-1">
            {selected.map((option) => (
              <span key={option} className="rounded bg-gray-100 px-1.5 py-0.5 text-xs">
                {option}
              </span>
            ))}
          </span>
        ) : (
          <span className="text-gray-400">選擇或新增{label}</span>
        )}
      </button>

      {open &&
        rect &&
        createPortal(
          <div
            ref={panelRef}
            style={{ top: rect.top, left: rect.left, width: rect.width }}
            className="fixed z-50 overflow-hidden rounded-lg border bg-white shadow-lg"
          >
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (canCreate) create();
                  else if (filtered.length > 0) pick(filtered[0]);
                }
                if (e.key === "Escape") setOpen(false);
              }}
              placeholder={`搜尋或新增${label}`}
              className="w-full border-b px-3 py-2 text-sm outline-none"
            />

            <ul className="max-h-56 overflow-y-auto py-1">
              {selected.length > 0 && (
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      onChange("");
                      setQuery("");
                      if (!multiple) setOpen(false);
                    }}
                    className="w-full px-3 py-1.5 text-left text-xs text-gray-400 hover:bg-gray-50"
                  >
                    清除選擇
                  </button>
                </li>
              )}

              {filtered.map((option) => (
                <li key={option} className="flex items-center gap-1 px-1">
                  <button
                    type="button"
                    onClick={() => pick(option)}
                    className={`flex-1 rounded px-2 py-1.5 text-left text-sm hover:bg-gray-50 ${
                      isSelected(option) ? "font-medium" : ""
                    }`}
                  >
                    {multiple && (
                      <span className="mr-1.5 text-xs text-gray-400">
                        {isSelected(option) ? "✓" : "＋"}
                      </span>
                    )}
                    {option}
                  </button>
                  {/* 用了幾次；選單照次數排，這個數字說明為什麼是這個順序 */}
                  <span className="shrink-0 px-1.5 text-[11px] text-gray-300 tabular-nums">
                    {counts[categoryKey].get(option) ?? 0}
                  </span>
                </li>
              ))}

              {canCreate && (
                <li>
                  <button
                    type="button"
                    onClick={create}
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-50"
                  >
                    新增「<span className="font-medium">{keyword}</span>」
                  </button>
                </li>
              )}

              {filtered.length === 0 && !canCreate && (
                <li className="px-3 py-2 text-xs text-gray-400">打字就可以新增</li>
              )}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
}
