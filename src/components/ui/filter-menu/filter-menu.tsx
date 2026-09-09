"use client";

import { useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { styles as controlStyles } from "@/components/ui/controls/styles";
import { useOutsideClick } from "@/hooks/use-outside-click";

const styles = {
  root: "relative shrink-0",
  // 選單靠右對齊，比 controlStyles.menu 寬一點裝得下篩選群組；顏色與項目長相跟它共用
  panel: `${controlStyles.menu} right-0 max-h-80 w-48 divide-y overflow-y-auto`,
  group: "py-1",
  groupLabel: "px-3 pt-1 pb-0.5 text-[11px] text-ink-faint",
  item: controlStyles.menuItem,
  label: "min-w-0 flex-1 truncate",
  check: "shrink-0 text-ink",
  empty: "px-3 py-1.5 text-xs text-ink-faint",
};

export type FilterGroup = {
  /** 網址參數的名字，也是這一組的識別 */
  key: string;
  label: string;
  options: string[];
  /** 空字串代表全部 */
  value: string;
};

/**
 * 篩選收在按鈕裡，點了才展開。
 *
 * 頁首那一排本來就擠，而篩選是偶爾才動一次的東西，不該一直佔著位置。
 * 窄螢幕連文字都收掉只留圖示；篩選中的時候按鈕直接顯示篩的是什麼。
 *
 * 選項與目前的值都由呼叫端給——它不認得書、也不認得紀事，只管長相與展開收合。
 */
export function FilterMenu({
  groups,
  onChange,
}: {
  groups: FilterGroup[];
  onChange: (key: string, next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useOutsideClick<HTMLDivElement>(open, () => setOpen(false));

  function pick(key: string, next: string) {
    onChange(key, next);
    setOpen(false);
  }

  const active = groups.filter((g) => g.value);

  return (
    <div ref={rootRef} className={styles.root}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`${controlStyles.link} ${controlStyles.linkIdle} ${active.length > 0 ? "font-semibold" : ""}`}
      >
        <span>{active.length > 0 ? active.map((g) => g.value).join("・") : "篩選"}</span>
        <ChevronDown size={14} strokeWidth={1.5} className="text-ink-faint shrink-0" aria-hidden />
      </button>

      {open && (
        <div className={styles.panel}>
          {groups.map((group) => (
            <div key={group.key} className={styles.group}>
              {group.label && <p className={styles.groupLabel}>{group.label}</p>}

              {group.options.length === 0 ? (
                <p className={styles.empty}>還沒有任何{group.label}</p>
              ) : (
                <>
                  <button type="button" onClick={() => pick(group.key, "")} className={styles.item}>
                    <span
                      className={`${styles.label} ${!group.value ? "text-ink font-medium" : "text-ink-muted"}`}
                    >
                      全部
                    </span>
                    {!group.value && <Check size={14} strokeWidth={2} className={styles.check} />}
                  </button>
                  {group.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => pick(group.key, option)}
                      className={styles.item}
                    >
                      <span
                        className={`${styles.label} ${group.value === option ? "text-ink font-medium" : "text-ink-muted"}`}
                      >
                        {option}
                      </span>
                      {group.value === option && (
                        <Check size={14} strokeWidth={2} className={styles.check} />
                      )}
                    </button>
                  ))}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
