"use client";

import { useState } from "react";

const styles = {
  wrap: "flex shrink-0 flex-col gap-2",
  error: "text-xs text-red-600",
  row: "flex flex-wrap items-center gap-2",
  save: "rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50",
  cancel: "rounded border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50",
  // 刪除一律靠最右邊，跟儲存隔開，不會順手按到
  danger: "ml-auto flex items-center gap-2 text-xs",
  remove: "text-red-600 hover:underline disabled:opacity-50",
  confirm:
    "rounded bg-red-600 px-3 py-1.5 font-medium text-white hover:bg-red-700 disabled:opacity-50",
  confirmCancel: "rounded border px-3 py-1.5 text-gray-600 hover:bg-gray-50",
};

type FormActionsProps = {
  /** 沒給 onSave 就是 type="submit"，交給外面那個 form 的 onSubmit */
  onSave?: () => void;
  saving?: boolean;
  saveLabel?: string;
  /** 給了才畫取消 */
  onCancel?: () => void;
  /** 給了才畫刪除；一律先問一次再刪 */
  onDelete?: () => void;
  deleteLabel?: string;
  confirmLabel?: string;
  /** 這張表單特有的按鈕，例如「查維基」，排在取消後面 */
  extra?: React.ReactNode;
  error?: string;
};

/**
 * 每張編輯表單底部那一列。
 *
 * 抽出來是因為它們原本各寫各的：有的刪除在最上面、有的在最下面，有的問一次
 * 才刪、有的按了就刪。這種「同一件事在不同頁長得不一樣」的差異沒有任何理由，
 * 只是先後寫成的。位置與行為都定在這裡：儲存在左、刪除在最右、刪除一定先問。
 */
export function FormActions({
  onSave,
  saving = false,
  saveLabel = "儲存",
  onCancel,
  onDelete,
  deleteLabel = "刪除",
  confirmLabel = "確定刪除？",
  extra,
  error,
}: FormActionsProps) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className={styles.wrap}>
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.row}>
        <button
          type={onSave ? "button" : "submit"}
          onClick={onSave}
          disabled={saving}
          className={styles.save}
        >
          {saving ? "儲存中…" : saveLabel}
        </button>

        {onCancel && (
          <button type="button" onClick={onCancel} className={styles.cancel}>
            取消
          </button>
        )}

        {extra}

        {onDelete &&
          (confirming ? (
            <div className={styles.danger}>
              <span className="text-gray-500">{confirmLabel}</span>
              <button type="button" onClick={onDelete} disabled={saving} className={styles.confirm}>
                刪除
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className={styles.confirmCancel}
              >
                取消
              </button>
            </div>
          ) : (
            <div className={styles.danger}>
              <button
                type="button"
                onClick={() => setConfirming(true)}
                disabled={saving}
                className={styles.remove}
              >
                {deleteLabel}
              </button>
            </div>
          ))}
      </div>
    </div>
  );
}
