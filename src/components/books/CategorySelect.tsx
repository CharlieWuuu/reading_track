"use client";

import { useEffect, useRef, useState } from "react";
import { BookCategories, joinTags, splitTags } from "@/types/book";
import { useCategories } from "@/lib/useCategories";

/**
 * 仿 Notion 的分類選擇器：下拉選單裡就能新增、改名、刪除選項，
 * 不用特地跑去設定頁。選項存在試算表的「選項」工作表。
 *
 * `multiple` 的欄位（屬性）可以複選，多個值以頓號存在同一格裡，
 * 這樣 Sheet 那邊還是一欄，不用為了複選改表結構。
 */
export function CategorySelect({
  label,
  categoryKey,
  value,
  onChange,
  multiple = false,
}: {
  label: string;
  categoryKey: keyof BookCategories;
  value: string;
  onChange: (value: string) => void;
  multiple?: boolean;
}) {
  const { categories, save } = useCategories();
  const options = categories[categoryKey];

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  // 點到別的地方就收起來
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const keyword = query.trim();
  const filtered = keyword
    ? options.filter((o) => o.toLowerCase().includes(keyword.toLowerCase()))
    : options;
  const canCreate = keyword.length > 0 && !options.includes(keyword);

  function replaceOptions(next: string[]) {
    save({ ...categories, [categoryKey]: next });
  }

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
      joinTags(
        isSelected(option) ? selected.filter((o) => o !== option) : [...selected, option]
      )
    );
    setQuery("");
  }

  function create() {
    if (!canCreate) return;
    replaceOptions([...options, keyword]);
    pick(keyword);
  }

  function rename(from: string) {
    const to = editValue.trim();
    setEditing(null);
    if (!to || to === from || options.includes(to)) return;
    replaceOptions(options.map((o) => (o === from ? to : o)));
    // 目前選的就是被改名的那個，跟著改
    if (isSelected(from)) onChange(joinTags(selected.map((o) => (o === from ? to : o))));
  }

  function remove(option: string) {
    replaceOptions(options.filter((o) => o !== option));
    if (isSelected(option)) onChange(joinTags(selected.filter((o) => o !== option)));
  }

  return (
    <div ref={rootRef} className="relative">
      <label className="mb-1 block text-sm font-medium">{label}</label>

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

      {open && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border bg-white shadow-lg">
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
              <li key={option} className="group flex items-center gap-1 px-1">
                {editing === option ? (
                  <input
                    autoFocus
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        rename(option);
                      }
                      if (e.key === "Escape") setEditing(null);
                    }}
                    onBlur={() => rename(option)}
                    className="my-0.5 w-full rounded border px-2 py-1 text-sm"
                  />
                ) : (
                  <>
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
                    <button
                      type="button"
                      aria-label={`重新命名 ${option}`}
                      onClick={() => {
                        setEditing(option);
                        setEditValue(option);
                      }}
                      className="rounded px-1.5 py-1 text-xs text-gray-400 opacity-0 hover:bg-gray-100 hover:text-gray-700 group-hover:opacity-100"
                    >
                      改名
                    </button>
                    <button
                      type="button"
                      aria-label={`刪除 ${option}`}
                      onClick={() => remove(option)}
                      className="rounded px-1.5 py-1 text-xs text-gray-400 opacity-0 hover:bg-gray-100 hover:text-red-600 group-hover:opacity-100"
                    >
                      刪除
                    </button>
                  </>
                )}
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
              <li className="px-3 py-2 text-xs text-gray-400">還沒有任何選項</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
