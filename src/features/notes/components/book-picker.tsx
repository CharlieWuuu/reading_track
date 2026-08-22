"use client";

import { useState } from "react";
import { useOutsideClick } from "@/hooks/use-outside-click";
import { Book } from "@/types/book";

const styles = {
  root: "relative min-w-0",
  label: "mb-1 block text-xs font-medium text-gray-500",
  field: "flex items-center gap-1 rounded-control border px-3 py-2",
  input: "min-w-0 flex-1 text-sm outline-none",
  panel:
    "absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-surface border bg-white py-1 shadow-lg",
  item: "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-gray-50",
  cover: "h-8 w-[22px] shrink-0 rounded-thumb object-cover",
  blank: "h-8 w-[22px] shrink-0 rounded-thumb bg-gray-100",
  title: "min-w-0 flex-1 truncate",
  empty: "px-3 py-2 text-xs text-gray-400",
};

/**
 * 這一句是從哪本書來的。
 *
 * 跟書寫的 SourcePicker 不同：那裡可以自己打字（讀系統外的東西也能寫），
 * 這裡一定要選中一本——佳句與單字靠 bookId 掛回那本書，沒有 id 就成了孤兒。
 */
export function BookPicker({
  books,
  value,
  onChange,
}: {
  books: Book[];
  /** 選中的那本；還沒選就是 null */
  value: Book | null;
  onChange: (book: Book | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const rootRef = useOutsideClick<HTMLDivElement>(open, () => setOpen(false));

  const query = (value ? "" : text).trim().toLowerCase();
  const matches = (
    query ? books.filter((b) => b.title.toLowerCase().includes(query)) : books
  ).slice(0, 20);

  return (
    <div ref={rootRef} className={styles.root}>
      <label className={styles.label}>哪一本書</label>

      <div className={styles.field}>
        <input
          value={value ? value.title : text}
          onChange={(e) => {
            setText(e.target.value);
            onChange(null); // 又開始打字就是要換一本，先把選中的清掉
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="打字搜尋"
          className={styles.input}
        />
      </div>

      {open && (
        <div className={styles.panel}>
          {matches.length === 0 ? (
            <p className={styles.empty}>沒有符合的書</p>
          ) : (
            matches.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => {
                  onChange(b);
                  setText("");
                  setOpen(false);
                }}
                className={styles.item}
              >
                {b.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.coverUrl} alt="" className={styles.cover} />
                ) : (
                  <div className={styles.blank} />
                )}
                <span className={styles.title}>{b.title}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
