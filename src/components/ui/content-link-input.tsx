"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import {
  FIELD_CONTROL_CLASS,
  FIELD_INPUT_CLASS,
  FIELD_ROW_CLASS,
  FieldLabel,
} from "@/components/ui/field-label";
import { searchContentLinks } from "@/hooks/use-content-links";
import { useOutsideClick } from "@/hooks/use-outside-click";
import type { Linkable } from "@/types/record";

const styles = {
  wrap: "flex flex-col gap-2",
  row: FIELD_ROW_CLASS,
  field: `relative ${FIELD_CONTROL_CLASS}`,
  input: `${FIELD_INPUT_CLASS} box-border block w-full max-w-full text-sm`,
  list: "flex flex-wrap gap-1.5 md:pl-[4.5rem]",
  chip: "rounded-control flex items-center gap-1 border-rule border bg-gray-50 px-2 py-0.5 text-xs",
  chipKind: "text-ink-faint",
  remove: "rounded-control p-0.5 text-gray-400 hover:bg-gray-100 hover:text-red-600",
  panel:
    "absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-surface border bg-white py-1 shadow-lg",
  panelItem: "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-gray-50",
  panelKind: "text-ink-faint text-xs",
  empty: "px-3 py-2 text-xs text-gray-400",
};

/**
 * 站內任何內容（作品、片段、書寫）互相關聯的單一輸入框。
 *
 * 已連結的顯示成框內的 chip，同一格打字繼續搜，選中就加一個 chip——
 * 不分紀錄／片段／專欄，內容本身是哪一種只在 chip 上用小字標。
 */
export function ContentLinkInput({
  label,
  excludeId,
  linked,
  onLink,
  onUnlink,
  placeholder = "搜尋任何紀錄、片段、專欄來關聯",
}: {
  /** 跟 input 同一行排版的欄位標籤 */
  label?: string;
  /** 正在編輯的這一筆自己，搜尋結果要排除它 */
  excludeId?: string;
  linked: Linkable[];
  onLink: (item: Linkable) => void;
  onUnlink: (id: string) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [matches, setMatches] = useState<Linkable[]>([]);
  const rootRef = useOutsideClick<HTMLDivElement>(open, () => setOpen(false));

  const query = text.trim();

  useEffect(() => {
    if (!query) return;
    let cancelled = false;
    searchContentLinks(query, excludeId).then((items) => {
      if (!cancelled) {
        const linkedIds = new Set(linked.map((item) => item.id));
        setMatches(items.filter((item) => !linkedIds.has(item.id)));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [query, excludeId, linked]);

  const visibleMatches = query ? matches : [];

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        {label && <FieldLabel label={label} />}
        <div ref={rootRef} className={styles.field}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            className={styles.input}
          />

          {open && query && (
            <div className={styles.panel}>
              {visibleMatches.length === 0 ? (
                <p className={styles.empty}>沒有符合的</p>
              ) : (
                visibleMatches.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onLink(item);
                      setText("");
                      setOpen(false);
                    }}
                    className={styles.panelItem}
                  >
                    <span className={styles.panelKind}>{item.kindName}</span>
                    {item.label || "（空白）"}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {linked.length > 0 && (
        <div className={styles.list}>
          {linked.map((item) => (
            <span key={item.id} className={styles.chip}>
              <span className={styles.chipKind}>{item.kindName}</span>
              {item.label || "（空白）"}
              <button
                type="button"
                onClick={() => onUnlink(item.id)}
                aria-label="取消關聯"
                className={styles.remove}
              >
                <X size={12} strokeWidth={1.5} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
