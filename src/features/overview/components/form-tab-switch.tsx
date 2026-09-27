"use client";

import { styles } from "@/components/ui/controls/styles";
import { KindGroup } from "@/config/kind-groups";
import { useFormTabStore } from "@/stores/use-form-tab-store";
import { FORM_TAB_LABELS, formTabsOf } from "@/utils/module-form";

/**
 * 表單頁首的分頁切換：紀錄是作品／內容／屬性，片段與書寫是內容／屬性。
 * 純文字，跟頁首「概覽／表格」同一套長相。
 *
 * 狀態放 store：這顆在 PageHeader，跟 ModuleForm 是兄弟，拿不到對方的 state。
 */
export function FormTabSwitch({ group }: { group: KindGroup }) {
  const { tab, setTab } = useFormTabStore();

  return (
    <div className="flex items-center gap-3">
      {formTabsOf(group).map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => setTab(key)}
          aria-pressed={key === tab}
          className={`${styles.link} ${key === tab ? styles.linkActive : styles.linkIdle}`}
        >
          {FORM_TAB_LABELS[key]}
        </button>
      ))}
    </div>
  );
}
