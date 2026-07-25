"use client";

import { useState } from "react";
import { useBookStore } from "@/store/useBookStore";
import { BookCategories } from "@/types/book";

const LABELS: Record<keyof BookCategories, string> = {
  domain: "領域",
  type: "屬性",
  language: "語言",
};

function CategoryGroup({ categoryKey }: { categoryKey: keyof BookCategories }) {
  const { categories, addCategoryOption, removeCategoryOption, renameCategoryOption } =
    useBookStore();
  const options = categories[categoryKey];
  const [newValue, setNewValue] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  function handleAdd() {
    const value = newValue.trim();
    if (!value) return;
    addCategoryOption(categoryKey, value);
    setNewValue("");
  }

  function startEdit(option: string) {
    setEditing(option);
    setEditValue(option);
  }

  function commitEdit() {
    if (editing) {
      renameCategoryOption(categoryKey, editing, editValue.trim());
    }
    setEditing(null);
    setEditValue("");
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
                <button
                  type="button"
                  onClick={() => startEdit(option)}
                  className="text-xs text-gray-500 hover:underline"
                >
                  重新命名
                </button>
                <button
                  type="button"
                  onClick={() => removeCategoryOption(categoryKey, option)}
                  className="text-xs text-red-600 hover:underline"
                >
                  刪除
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
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
        管理「領域」「屬性」「語言」的可選項目，可新增、刪除或重新命名。
      </p>
      <div className="grid grid-cols-3 gap-6">
        <CategoryGroup categoryKey="domain" />
        <CategoryGroup categoryKey="type" />
        <CategoryGroup categoryKey="language" />
      </div>
    </div>
  );
}
