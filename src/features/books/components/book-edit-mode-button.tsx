"use client";

import { styles } from "@/components/ui/controls/styles";
import { useUrlParams } from "@/hooks/use-url-param";

/**
 * 表格檢視的編輯模式總開關。放在頁首（搜尋框右邊、檢視方式選單左邊），
 * 狀態走網址參數（edit=1）——BookTable 讀同一個參數，兩邊不用另外接線。
 *
 * 不是「主要／次要」動作，是開關切換，長相借用全站的 segment 樣式
 * （分頁、檢視切換同一套），不套 ActionButton 的 primary/secondary。
 *
 * 手機版沒有這個可編輯的表格（BookTableGrid 是 hidden md:block，手機走
 * 卡片列表），按鈕留著會是個點了沒反應的死按鈕，還擠占本來就窄的頁首，
 * 所以只在 md 以上顯示。
 */
export function BookEditModeButton() {
  const { searchParams, setParams } = useUrlParams();
  const editAll = searchParams.get("edit") === "1";

  return (
    <button
      type="button"
      onClick={() => setParams({ edit: editAll ? null : "1" })}
      className={`hidden md:flex ${styles.segmentBox} ${styles.segment} ${editAll ? styles.segmentActive : styles.segmentIdle}`}
    >
      {editAll ? "完成編輯" : "編輯模式"}
    </button>
  );
}
