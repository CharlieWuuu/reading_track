"use client";

import { styles as controls } from "@/components/ui/controls/styles";
import { KindGroup } from "@/config/kind-groups";
import { useFormTabStore } from "@/stores/use-form-tab-store";
import { FORM_TAB_LABELS, formTabsOf } from "@/utils/module-form";

/**
 * 表單的分頁切換：紀錄是作品／內容／屬性，片段與書寫是內容／屬性。桌機在右欄，手機沒有右欄就放頁首。
 *
 * 狀態放 store：這兩顆跟 ModuleForm 是兄弟，拿不到對方的 state。
 */

const styles = {
  row: "flex items-center gap-3 lg:hidden",
  // 右欄分頁：跟設定頁分類那張清單同一種列
  nav: "flex flex-col",
  navItem: "border-rule-soft text-ui border-b py-[7px] pl-3 text-left",
  navOn: "text-ink font-semibold",
  navOff: "text-ink-muted hover:text-ink",
};

/** 頁首那排，只給手機 */
export function FormTabSwitch({ group }: { group: KindGroup }) {
  const { tab, setTab } = useFormTabStore();
  return (
    <div className={styles.row}>
      {formTabsOf(group).map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => setTab(key)}
          aria-pressed={key === tab}
          className={`${controls.link} ${key === tab ? controls.linkActive : controls.linkIdle}`}
        >
          {FORM_TAB_LABELS[key]}
        </button>
      ))}
    </div>
  );
}

/** 右欄那份，桌機用 */
export function FormTabNav({ group }: { group: KindGroup }) {
  const { tab, setTab } = useFormTabStore();
  return (
    <nav className={styles.nav} aria-label="表單分頁">
      {formTabsOf(group).map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => setTab(key)}
          aria-pressed={key === tab}
          className={`${styles.navItem} ${key === tab ? styles.navOn : styles.navOff}`}
        >
          {FORM_TAB_LABELS[key]}
        </button>
      ))}
    </nav>
  );
}
