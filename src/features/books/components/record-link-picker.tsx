"use client";

import { useState } from "react";
import { Link2, Plus, X } from "lucide-react";
import { useOutsideClick } from "@/hooks/use-outside-click";

const styles = {
  wrap: "flex flex-col items-stretch gap-2 md:min-h-0 md:flex-1 md:overflow-y-auto",
  list: "flex shrink-0 flex-col divide-y overflow-hidden rounded-control border",
  item: "flex w-full min-w-0 items-center gap-2 px-3 py-2 text-left",
  itemText: "min-w-0 flex-1 truncate text-sm text-gray-700",
  remove: "shrink-0 rounded-control p-1 text-gray-400 hover:bg-gray-100 hover:text-red-600",
  pickerRoot: "relative min-w-0",
  field: "flex items-center gap-1 rounded-control border px-3 py-1.5",
  input: "min-w-0 flex-1 text-sm outline-none",
  panel:
    "absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-surface border bg-white py-1 shadow-lg",
  panelItem: "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-gray-50",
  empty: "px-3 py-2 text-xs text-gray-400",
  hint: "text-xs text-gray-400",
};

/**
 * 這本書已連結的佳句／單字，加一個搜尋框把還沒連書的既有紀錄接上來。
 *
 * 跟 QuoteListInput 那種內嵌新增不同：這裡不寫內容，只管「連到哪本書」——
 * 內容的新增／編輯交給各自的獨立入口（QuickAddRecordForm、詳情頁）。
 */
export function RecordLinkPicker<T extends { id: string }>({
  linked,
  unlinked,
  labelOf,
  onLink,
  onUnlink,
  placeholder,
}: {
  /** 已連到這本書的列 */
  linked: T[];
  /** 還沒連到任何書的列，搜尋框從這裡挑 */
  unlinked: T[];
  labelOf: (row: T) => string;
  onLink: (row: T) => void;
  onUnlink: (row: T) => void;
  placeholder: string;
}) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useOutsideClick<HTMLDivElement>(open, () => setOpen(false));

  const query = text.trim().toLowerCase();
  const matches = (
    query ? unlinked.filter((row) => labelOf(row).toLowerCase().includes(query)) : unlinked
  ).slice(0, 20);

  return (
    <div className={styles.wrap}>
      {linked.length > 0 && (
        <div className={styles.list}>
          {linked.map((row) => (
            <div key={row.id} className={styles.item}>
              <Link2 size={13} strokeWidth={1.5} className="shrink-0 text-gray-300" aria-hidden />
              <span className={styles.itemText}>{labelOf(row) || "（空白）"}</span>
              <button
                type="button"
                onClick={() => onUnlink(row)}
                aria-label="取消連結"
                className={styles.remove}
              >
                <X size={13} strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div ref={rootRef} className={styles.pickerRoot}>
        <div className={styles.field}>
          <Plus size={14} strokeWidth={1.5} className="shrink-0 text-gray-400" aria-hidden />
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className={styles.input}
          />
        </div>

        {open && (
          <div className={styles.panel}>
            {matches.length === 0 ? (
              <p className={styles.empty}>
                {unlinked.length === 0 ? "沒有還沒連書的既有紀錄" : "沒有符合的"}
              </p>
            ) : (
              matches.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => {
                    onLink(row);
                    setText("");
                    setOpen(false);
                  }}
                  className={styles.panelItem}
                >
                  <span className={styles.itemText}>{labelOf(row) || "（空白）"}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
