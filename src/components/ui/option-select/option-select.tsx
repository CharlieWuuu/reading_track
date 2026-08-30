"use client";

import { useState } from "react";
import { Pencil, type LucideIcon } from "lucide-react";
import { useOutsideClick } from "@/hooks/use-outside-click";

/**
 * 仿 Notion 的選擇器：搜尋、選，打字就能登一個還沒用過的值。
 *
 * 選項一律由呼叫端給——它們全都是從資料 group 出來的，沒有一張「選項」表
 * 要維護。`multiple` 的欄位可以複選，多個值存在同一格裡，Sheet 那邊還是一欄；
 * 分隔符可換，關鍵字那種一行一筆的欄位就傳換行。
 */
export function OptionSelect({
  label,
  Icon,
  options,
  counts,
  value,
  onChange,
  multiple = false,
  separator = "、",
  onEditOption,
  placeholder,
  hideLabel = false,
}: {
  label: string;
  /** 跟詳細卡片同一個圖示，兩邊看起來才像同一個欄位 */
  Icon?: LucideIcon;
  options: string[];
  /** 每個選項用了幾次；給了就顯示在選項右邊，說明為什麼是這個順序 */
  counts?: Map<string, number>;
  value: string;
  onChange: (value: string) => void;
  multiple?: boolean;
  /** 多個值怎麼串在同一格裡：預設頓號，一行一筆的欄位傳 "\n" */
  separator?: string;
  /** 給了就在每個已選的值上多一顆筆，點了把那個值交出去（例如去編關鍵字主檔） */
  onEditOption?: (value: string) => void;
  /** 沒選任何值時觸發鈕上的字，預設是「選擇或新增○○」 */
  placeholder?: string;
  /** 擠在按鈕列裡時用：不畫標籤，欄名改掛在觸發鈕的 aria-label 上 */
  hideLabel?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  // 收合的規則跟 SelectMenu 同一支 hook，兩顆選單不該各寫一份
  const rootRef = useOutsideClick<HTMLDivElement>(open, () => setOpen(false));

  const keyword = query.trim();
  const filtered = keyword
    ? options.filter((o) => o.toLowerCase().includes(keyword.toLowerCase()))
    : options;
  const canCreate = keyword.length > 0 && !options.includes(keyword);

  // 換行的那些欄位也認兩個字的「\n」：舊資料裡有一批是那樣存下來的
  const pattern = separator === "\n" ? /\r?\n|\\n/ : separator;
  const split = (raw: string) =>
    raw
      .split(pattern)
      .map((part) => part.trim())
      .filter(Boolean);
  const selected = multiple ? split(value) : value ? [value] : [];
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
      (isSelected(option) ? selected.filter((o) => o !== option) : [...selected, option]).join(
        separator,
      ),
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
      {!hideLabel && (
        <label className="mb-1 flex items-center gap-1.5 text-sm font-medium">
          {Icon && (
            <Icon size={14} strokeWidth={1.5} className="shrink-0 text-gray-400" aria-hidden />
          )}
          {label}
        </label>
      )}

      <div
        role="button"
        tabIndex={0}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpen((v) => !v)}
        className="rounded-control w-full cursor-pointer border px-3 py-2 text-left text-sm"
      >
        {selected.length > 0 ? (
          <span className="flex flex-wrap gap-1">
            {selected.map((option) => (
              <span
                key={option}
                className="rounded-control flex items-center gap-1 bg-gray-100 px-1.5 py-0.5 text-xs"
              >
                {option}
                {onEditOption && (
                  <button
                    type="button"
                    aria-label={`編輯 ${option}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditOption(option);
                    }}
                    className="text-gray-400 hover:text-gray-900"
                  >
                    <Pencil size={11} strokeWidth={1.5} />
                  </button>
                )}
              </span>
            ))}
          </span>
        ) : (
          <span className="text-gray-400">{placeholder ?? `選擇或新增${label}`}</span>
        )}
      </div>

      {/*
        選單貼著按鈕：absolute 定位，捲動時它本來就跟著一起走，不用量也不用補算。
        代價是外層 overflow 會裁到它——所以用它的表單那一層不要把選單那一側切掉。
      */}
      {open && (
        <div className="rounded-surface absolute top-full left-0 z-50 mt-1 flex max-h-56 w-full flex-col overflow-hidden border bg-white shadow-lg">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              // Enter 一律不新增，只擋住表單送出。
              // 中文輸入法選字就是按 Enter，讓它同時代表「加這個標籤」的話，
              // 打到一半（「清」還沒變成「清邁」）就會先被加進去。
              if (e.key === "Enter") e.preventDefault();
              if (e.key === "Escape") setOpen(false);
            }}
            placeholder={`搜尋或新增${label}`}
            className="w-full border-b px-3 py-2 text-sm outline-none"
          />

          <ul className="min-h-0 flex-1 overflow-y-auto py-1">
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
                  className={`rounded-control flex-1 px-2 py-1.5 text-left text-sm hover:bg-gray-50 ${
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
                  {counts?.get(option) ?? 0}
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
        </div>
      )}
    </div>
  );
}
