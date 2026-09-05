"use client";

import { useEffect, useRef, useState } from "react";
import { BookOpen, X } from "lucide-react";
import { useArticles } from "@/hooks/use-articles";
import { useBooks } from "@/hooks/use-books";

const styles = {
  root: "relative min-w-0",
  label: "mb-1 flex items-center gap-1.5 text-sm font-medium",
  hint: "text-xs font-normal text-gray-400",
  field: "flex items-center gap-1 rounded-control border px-3 py-2",
  input: "min-w-0 flex-1 text-sm outline-none",
  clear: "shrink-0 rounded-control p-0.5 text-gray-400 hover:bg-gray-100 hover:text-red-600",
  panel:
    "absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-surface border bg-white py-1 shadow-lg",
  item: "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-gray-50",
  cover: "h-8 w-[22px] shrink-0 rounded-thumb object-cover",
  blank: "h-8 w-[22px] shrink-0 rounded-thumb bg-gray-100",
  title: "min-w-0 flex-1 truncate",
  empty: "px-3 py-2 text-xs text-gray-400",
};

type Candidate = { id: string; title: string; coverUrl: string; kind: string };

/**
 * 選這則是讀了什麼之後寫的。
 *
 * 存兩份：標題給人看，編號給程式（改書名也不會斷）。
 * 也可以直接打字不選——讀了系統外的東西一樣寫得下。
 */
export function SourcePicker({
  title,
  onChange,
}: {
  title: string;
  /** 選了系統裡的紀錄就兩個都給；自己打字時 id 是空的 */
  onChange: (title: string, id: string) => void;
}) {
  const { books } = useBooks();
  const { articles } = useArticles();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const candidates: Candidate[] = [
    ...books.map((b) => ({ id: b.id, title: b.title, coverUrl: b.coverUrl, kind: "書籍" })),
    ...articles.map((a) => ({ id: a.id, title: a.title, coverUrl: "", kind: "文章" })),
  ];

  const query = title.trim().toLowerCase();
  const matches = query
    ? candidates.filter((c) => c.title.toLowerCase().includes(query)).slice(0, 20)
    : candidates.slice(0, 20);

  return (
    <div ref={rootRef} className={styles.root}>
      <label className={styles.label}>
        <BookOpen size={14} strokeWidth={1.5} className="shrink-0 text-gray-400" aria-hidden />
        延伸自
        <span className={styles.hint}>讀了什麼之後寫的</span>
      </label>

      <div className={styles.field}>
        <input
          value={title}
          onChange={(e) => onChange(e.target.value, "")}
          onFocus={() => setOpen(true)}
          placeholder="打字搜尋，或直接寫"
          className={styles.input}
        />
        {title && (
          <button
            type="button"
            onClick={() => onChange("", "")}
            aria-label="清除"
            className={styles.clear}
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {open && (
        <div className={styles.panel}>
          {matches.length === 0 ? (
            <p className={styles.empty}>沒有符合的書或文章，直接打字也可以</p>
          ) : (
            matches.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onChange(c.title, c.id);
                  setOpen(false);
                }}
                className={styles.item}
              >
                {c.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.coverUrl} alt="" className={styles.cover} />
                ) : (
                  <div className={styles.blank} />
                )}
                <span className={styles.title}>{c.title}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
