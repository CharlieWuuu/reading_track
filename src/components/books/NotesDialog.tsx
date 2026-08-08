"use client";

import { useEffect } from "react";
import { Quote as QuoteIcon, X } from "lucide-react";
import { QuoteRow } from "@/types/record";

/**
 * 心得與佳句的彈出視窗。
 *
 * 卡片上只露一行預覽，點開才看全文——筆記長度差很多，直接展開會把卡片
 * 撐得比其他張高好幾倍，一頁能放幾張也跟著跳動。
 */
export function NotesDialog({
  title,
  note,
  quotes,
  show = "all",
  onClose,
}: {
  title: string;
  note: string;
  quotes: QuoteRow[];
  /** 從哪一顆按鈕點進來的：只顯示那一塊，不用在視窗裡再找一次 */
  show?: "note" | "quotes" | "all";
  onClose: () => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const list = quotes;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${title} 的心得與佳句`}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 sm:items-center sm:p-6"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-2xl flex-col gap-3 rounded-t-xl border bg-white p-4 sm:rounded-xl sm:p-5"
      >
        <div className="flex shrink-0 items-start justify-between gap-3">
          <p className="min-w-0 truncate text-sm font-semibold">{title}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="關閉"
            className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto">
          {note && show !== "quotes" && (
            <section className="flex flex-col gap-1.5">
              <h3 className="text-xs font-medium text-gray-500">心得</h3>
              {/* 保留原本的換行，Sheet 裡怎麼打就怎麼顯示 */}
              <p className="text-sm leading-relaxed break-words whitespace-pre-wrap text-gray-700">
                {note}
              </p>
            </section>
          )}

          {list.length > 0 && show !== "note" && (
            <section className="flex flex-col gap-1.5">
              <h3 className="text-xs font-medium text-gray-500">佳句（{list.length}）</h3>
              <ul className="flex flex-col gap-2">
                {list.map((quote) => (
                  <li
                    key={quote.id}
                    className="flex items-start gap-2 rounded bg-[#F7EDCF]/50 px-2.5 py-2"
                  >
                    <QuoteIcon size={12} className="mt-1 shrink-0 text-[#B08A2E]" />
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                      <p className="text-sm leading-relaxed text-gray-700">{quote.text}</p>
                      {quote.note && (
                        <p className="border-l-2 pl-2 text-xs leading-relaxed text-gray-500">
                          {quote.note}
                        </p>
                      )}
                    </div>
                    {quote.chapter && (
                      <span className="shrink-0 text-xs text-gray-400">{quote.chapter}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
