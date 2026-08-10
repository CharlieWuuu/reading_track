"use client";

import { useState } from "react";
import { useBooks } from "@/lib/useBooks";
import { useCategories } from "@/lib/useCategories";
import { BookCategories, splitTags } from "@/types/book";

const LABELS: Record<keyof BookCategories, string> = {
  platform: "平台",
  domain: "領域",
  subDomain: "次領域",
  type: "屬性",
  language: "語言",
};

function CategoryGroup({ categoryKey }: { categoryKey: keyof BookCategories }) {
  const { stored, save } = useCategories();
  // 有幾本書真的用到這個值。預設清單塞了不少沒人用的，看得見才知道能不能刪
  const { books } = useBooks();
  // 用小寫當鍵：書籍讀進來時平台會被收斂成正式寫法（HyRead → Hyread），
  // 選項清單裡卻是使用者當初打的那個寫法，完全相等去比就會數成 0
  const counts = new Map<string, number>();
  for (const book of books) {
    for (const value of splitTags(book[categoryKey])) {
      const key = value.toLowerCase();
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  const countOf = (option: string) => counts.get(option.trim().toLowerCase()) ?? 0;

  // 舊版本的快取可能沒有這一組（例如剛加上的「平台」），兜底成空陣列
  // 用得多的排前面，沒人用的沉到最下面，一眼就看得出哪些可以刪
  const options = [...(stored[categoryKey] ?? [])].sort(
    (a, b) => countOf(b) - countOf(a) || a.localeCompare(b, "zh-Hant"),
  );
  const [newValue, setNewValue] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  function replaceOptions(next: string[]) {
    save({ ...stored, [categoryKey]: next });
  }

  function handleAdd() {
    const value = newValue.trim();
    if (!value || options.includes(value)) return;
    replaceOptions([...options, value]);
    setNewValue("");
  }

  function commitEdit() {
    const from = editing;
    const to = editValue.trim();
    setEditing(null);
    if (!from || !to || from === to || options.includes(to)) return;
    replaceOptions(options.map((o) => (o === from ? to : o)));
  }

  return (
    <div>
      <h4 className="mb-2 text-sm font-medium">{LABELS[categoryKey]}</h4>
      <ul className="mb-2 space-y-1">
        {options.map((option) => (
          <li key={option} className="flex items-center gap-2">
            {editing === option ? (
              <input
                autoFocus
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitEdit();
                  if (e.key === "Escape") setEditing(null);
                }}
                onBlur={commitEdit}
                className="w-full rounded border px-2 py-1 text-sm"
              />
            ) : (
              <>
                <span className="flex-1 text-sm">{option}</span>
                <span
                  className={`shrink-0 text-xs tabular-nums ${
                    countOf(option) ? "text-gray-400" : "text-gray-300"
                  }`}
                >
                  {countOf(option)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setEditing(option);
                    setEditValue(option);
                  }}
                  className="text-xs text-gray-500 hover:underline"
                >
                  重新命名
                </button>
                <button
                  type="button"
                  onClick={() => replaceOptions(options.filter((o) => o !== option))}
                  className="text-xs text-red-600 hover:underline"
                >
                  刪除
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      {options.some((o) => !countOf(o)) && (
        <button
          type="button"
          onClick={() => replaceOptions(options.filter((o) => countOf(o)))}
          className="mb-2 text-xs text-gray-500 hover:underline"
        >
          清掉沒用到的（{options.filter((o) => !countOf(o)).length}）
        </button>
      )}
      <div className="flex gap-2">
        <input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={`新增${LABELS[categoryKey]}選項`}
          className="w-full rounded border px-2 py-1 text-sm"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="shrink-0 rounded bg-gray-100 px-3 py-1 text-sm font-medium hover:bg-gray-200"
        >
          新增
        </button>
      </div>
    </div>
  );
}

export function CategoryManager() {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium">書籍分類選項</h3>
      <p className="mb-4 text-xs text-gray-500">
        管理「平台」「領域」「次領域」「屬性」「語言」的可選項目。選項存在試算表的「選項」工作表，
        換裝置也還在；編輯書籍時在下拉選單裡也能直接增修。
      </p>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <CategoryGroup categoryKey="platform" />
        <CategoryGroup categoryKey="domain" />
        <CategoryGroup categoryKey="subDomain" />
        <CategoryGroup categoryKey="type" />
        <CategoryGroup categoryKey="language" />
      </div>
    </div>
  );
}
