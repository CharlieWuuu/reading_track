"use client";

import { BookPagingMode, useBookViewStore } from "@/store/useBookViewStore";

const OPTIONS: Array<{ id: BookPagingMode; label: string; hint: string }> = [
  { id: "page", label: "分頁", hint: "一頁剛好塞滿一個畫面，用底部的箭頭翻頁" },
  { id: "scroll", label: "捲動", hint: "整份列表一次列出來，直接往下捲" },
];

/** 書單的呈現方式。偶爾才改一次，放設定頁就好，不用一直佔著書單頁的頁首 */
export function DisplaySettings() {
  const { paging, setPaging } = useBookViewStore();

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium">瀏覽方式</h3>
      <p className="mb-3 text-xs text-gray-500">
        套用到整個 app：書籍、文章與統計都跟著這個設定，記在這台裝置上。
      </p>
      <div className="space-y-2">
        {OPTIONS.map((option) => (
          <label
            key={option.id}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${
              paging === option.id ? "border-gray-900 bg-gray-50" : "border-gray-200"
            }`}
          >
            <input
              type="radio"
              name="paging"
              checked={paging === option.id}
              onChange={() => setPaging(option.id)}
              className="mt-0.5"
            />
            <span className="min-w-0">
              <span className="block text-sm font-medium">{option.label}</span>
              <span className="block text-xs text-gray-500">{option.hint}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
