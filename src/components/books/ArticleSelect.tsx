"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { instapaperReadUrl } from "@/lib/instapaper/readUrl";
import { useInstapaperArticles } from "@/lib/useInstapaperArticles";
import { splitLines } from "@/types/book";

const TRIGGER_CLASS =
  "w-full rounded border px-3 py-1.5 text-left text-sm text-gray-500 hover:bg-gray-50";
const PANEL_CLASS = "fixed z-50 overflow-hidden rounded-lg border bg-white shadow-lg";
const SEARCH_CLASS = "w-full border-b px-3 py-2 text-sm outline-none";
const ITEM_CLASS =
  "flex w-full items-baseline gap-1.5 px-3 py-1.5 text-left text-sm hover:bg-gray-50";
const EMPTY_CLASS = "px-3 py-2 text-xs text-gray-400";
const LIST_CLASS = "flex flex-col divide-y overflow-hidden rounded border";
const ROW_CLASS = "flex items-center gap-1 py-2 pr-1 pl-3";
const ROW_TEXT_CLASS = "min-w-0 flex-1 truncate text-sm";
const REMOVE_CLASS = "shrink-0 rounded p-1.5 text-gray-400 hover:bg-gray-200 hover:text-red-600";

type ArticleSelectProps = {
  value: string;
  onChange: (value: string) => void;
};

/** 從已抓下來的 Instapaper 書籤挑文章寫回「相關文章」，存的仍是一行一個網址 */
export function ArticleSelect({ value, onChange }: ArticleSelectProps) {
  const { articles, isLoading } = useInstapaperArticles();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<{ top: number; left: number; width: number } | null>(null);

  // 點到別的地方就收起來（選單在 body 底下，所以兩塊都要檢查）
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

  // 定位理由同 CategorySelect：表單外層 overflow-hidden，留在原地會被裁掉
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

  const lines = splitLines(value);
  const keyword = query.trim().toLowerCase();
  const filtered = keyword
    ? articles.filter((a) => `${a.title ?? ""} ${a.url ?? ""}`.toLowerCase().includes(keyword))
    : articles;

  // 兩種網址都算選過：使用者可能自己貼了原文網址
  const isPicked = (readUrl: string, originalUrl: string) =>
    lines.some((line) => line === readUrl || line === originalUrl);

  /** 已經在格子裡的就移掉，當開關用比只能加不能減好用 */
  function toggle(readUrl: string, originalUrl: string) {
    const next = isPicked(readUrl, originalUrl)
      ? lines.filter((line) => line !== readUrl && line !== originalUrl)
      : [...lines, readUrl];
    onChange(next.join("\n"));
    setQuery("");
  }

  // 存的是網址，標題要從抓下來的清單對回去；對不到（自己貼的）就顯示網址本身
  const titleOf = (url: string) => {
    const found = articles.find(
      (a) => a.url === url || instapaperReadUrl(a.bookmark_id, a.url) === url,
    );
    return found?.title || url;
  };

  return (
    <div ref={rootRef} className="relative flex shrink-0 flex-col gap-2">
      {lines.length > 0 && (
        <div className={LIST_CLASS}>
          {lines.map((url) => (
            <div key={url} className={ROW_CLASS}>
              <span title={url} className={ROW_TEXT_CLASS}>
                {titleOf(url)}
              </span>
              <button
                type="button"
                aria-label="移除這篇"
                onClick={() => onChange(lines.filter((line) => line !== url).join("\n"))}
                className={REMOVE_CLASS}
              >
                <X size={14} strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button type="button" onClick={() => setOpen((v) => !v)} className={TRIGGER_CLASS}>
        ＋ 從 Instapaper 選文章
      </button>

      {open &&
        rect &&
        createPortal(
          <div
            ref={panelRef}
            style={{ top: rect.top, left: rect.left, width: rect.width }}
            className={PANEL_CLASS}
          >
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
                if (e.key === "Enter") {
                  e.preventDefault();
                  const first = filtered[0];
                  if (first) toggle(instapaperReadUrl(first.bookmark_id, first.url), first.url);
                }
              }}
              placeholder="搜尋文章標題或網址"
              className={SEARCH_CLASS}
            />

            <ul className="max-h-56 overflow-y-auto py-1">
              {filtered.slice(0, 50).map((a) => {
                const readUrl = instapaperReadUrl(a.bookmark_id, a.url);
                const picked = isPicked(readUrl, a.url);
                return (
                  <li key={a.bookmark_id}>
                    <button
                      type="button"
                      onClick={() => toggle(readUrl, a.url)}
                      className={`${ITEM_CLASS} ${picked ? "font-medium" : ""}`}
                    >
                      <span className="shrink-0 text-xs text-gray-400">{picked ? "✓" : "＋"}</span>
                      <span className="min-w-0 truncate">{a.title || a.url}</span>
                    </button>
                  </li>
                );
              })}

              {filtered.length === 0 && (
                <li className={EMPTY_CLASS}>
                  {isLoading
                    ? "載入中…"
                    : articles.length === 0
                      ? "尚未連接 Instapaper"
                      : "找不到文章"}
                </li>
              )}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
}
