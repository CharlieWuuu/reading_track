"use client";

import { styles } from "@/components/ui/controls/styles";
import { useFormTabStore } from "@/stores/use-form-tab-store";
import { FormTab } from "@/utils/record-form";

const ITEMS: { key: FormTab; label: string }[] = [
  { key: "content", label: "內容" },
  { key: "attributes", label: "屬性" },
];

/**
 * 表單頁首的內容／屬性切換。純文字，跟頁首「概覽／表格」同一套長相。
 *
 * 狀態放 store：這顆在 PageHeader，跟 ModuleForm 是兄弟，拿不到對方的 state。
 */
export function FormTabSwitch() {
  const { tab, setTab } = useFormTabStore();

  return (
    <div className="flex items-center gap-3">
      {ITEMS.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => setTab(item.key)}
          aria-pressed={item.key === tab}
          className={`${styles.link} ${item.key === tab ? styles.linkActive : styles.linkIdle}`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
