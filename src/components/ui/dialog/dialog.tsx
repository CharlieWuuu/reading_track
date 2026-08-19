"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

const styles = {
  backdrop:
    "fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 sm:items-center sm:p-6",
  panel:
    "flex max-h-[85vh] w-full max-w-2xl flex-col gap-3 rounded-t-xl border bg-white p-4 sm:rounded-xl sm:p-5",
  head: "flex shrink-0 items-start justify-end gap-3",
  title: "mr-auto min-w-0 truncate text-sm font-semibold",
  close: "shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900",
  body: "flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto",
};

type DialogProps = {
  /** 一定要有，至少當作 aria-label；showTitle 決定畫不畫出來 */
  title: string;
  /** 內容本身已經說明是什麼的時候（例如第一欄就是那個詞），標題只是重複 */
  showTitle?: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

/** 手機從底部長出來、桌機置中的彈出視窗。點背景或按 Esc 關閉 */
export function Dialog({ title, showTitle = true, onClose, children }: DialogProps) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      className={styles.backdrop}
    >
      <div onClick={(e) => e.stopPropagation()} className={styles.panel}>
        <div className={styles.head}>
          {showTitle && <p className={styles.title}>{title}</p>}
          <button type="button" onClick={onClose} aria-label="關閉" className={styles.close}>
            <X size={16} />
          </button>
        </div>

        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
