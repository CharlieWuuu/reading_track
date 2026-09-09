"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormActions } from "@/components/ui/form-actions";
import { KindTemplate, templatesOf } from "@/config/kind-templates";
import { MODULES } from "@/config/modules";
import { KindGroup } from "@/config/record-kinds";
import { useKinds } from "@/hooks/use-kinds";

/**
 * 新增類型。類型是資料不是程式——勾完就有清單、詳情、表單三頁，不用寫 code。
 *
 * 模組是我們預先規劃好的一組空位，使用者從裡面挑，不能發明新的。門檻寫在
 * config/modules.ts：至少三個類型會用到才進模組庫。
 */

const styles = {
  section: "flex flex-col gap-3 pt-6 first:pt-0",
  sectionHead: "border-rule-strong flex items-baseline gap-3 border-b-2 pb-1.5",
  step: "text-meta text-ink-faint tabular-nums",
  sectionLabel: "font-serif text-item-sm font-semibold tracking-wide",
  hint: "text-meta text-ink-faint",
  row: "border-rule flex items-start gap-3 border-b py-2.5",
  moduleLabel: "font-serif text-item-sm font-semibold",
  moduleHint: "text-meta text-ink-faint",
  count: "text-meta text-ink-faint tabular-nums ml-auto",
  input: "rounded-control border-rule w-full max-w-xs border px-2.5 py-1.5 text-sm",
  preview: "border-rule flex flex-wrap gap-x-4 gap-y-1 border-t pt-3",
  previewItem: "text-meta text-ink-muted",
};

function Section({
  step,
  label,
  hint,
  children,
}: {
  step: string;
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHead}>
        <span className={styles.step}>{step}</span>
        <span className={styles.sectionLabel}>{label}</span>
        {hint}
      </div>
      {children}
    </div>
  );
}

export function TypeBuilder({ group, groupLabel }: { group: KindGroup; groupLabel: string }) {
  const router = useRouter();
  const { kinds, addKind } = useKinds();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [unit, setUnit] = useState("");
  const [picked, setPicked] = useState<string[]>(["title"]);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const toggle = (key: string) =>
    setPicked((keys) => (keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key]));

  const siblings = kinds.filter((kind) => kind.group === group);
  const taken = new Set(siblings.map((kind) => kind.name));
  /** 範本是常駐的：刪掉「書籍」還能再套一次。已經有的就不重複列 */
  const templates = templatesOf(group).filter((template) => !taken.has(template.name));

  function applyTemplate(template: KindTemplate) {
    setName(template.name);
    setSlug(template.key);
    setUnit(template.amountUnit);
    setPicked([...template.modules]);
    setLabels({ ...template.labels });
  }

  async function save() {
    setSaving(true);
    setError(undefined);
    try {
      await addKind(group, {
        name: name.trim(),
        slug: slug.trim(),
        modules: picked,
        amountUnit: unit.trim(),
        labels,
      });
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "新增類型失敗");
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim() && slug.trim()) void save();
      }}
      className="flex max-w-2xl flex-col"
    >
      <Section step="01" label="從哪裡開始">
        <div>
          {templates.map((template) => (
            <button
              key={template.key}
              type="button"
              onClick={() => applyTemplate(template)}
              className={`${styles.row} w-full text-left`}
            >
              <span className="min-w-0">
                <span className={styles.moduleLabel}>{template.name}</span>
                <span className={`${styles.moduleHint} block`}>
                  {template.modules
                    .map(
                      (key) => template.labels?.[key] ?? MODULES.find((m) => m.key === key)?.label,
                    )
                    .filter(Boolean)
                    .join("・")}
                </span>
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setName("");
              setSlug("");
              setUnit("");
              setPicked([]);
              setLabels({});
            }}
            className={`${styles.row} w-full text-left`}
          >
            <span>
              <span className={styles.moduleLabel}>全部自己勾</span>
              <span className={`${styles.moduleHint} block`}>空白開始</span>
            </span>
          </button>
        </div>
        <span className={styles.hint}>套了範本還是可以改。範本常駐，刪掉的類型隨時能再套一次</span>
      </Section>

      <Section step="02" label="叫什麼">
        <input
          aria-label="名稱"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={styles.input}
        />
        <input
          aria-label="網址"
          placeholder="英文小寫、連字號，例如 movie"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className={styles.input}
        />
        <input
          aria-label="量的單位"
          placeholder="頁／分鐘／字"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          className={styles.input}
        />
        <span className={styles.hint}>統計讀「量＋單位」自己長句子，加類型不用改統計程式</span>
      </Section>

      <Section
        step="03"
        label="要哪些模組"
        hint={
          <span className={styles.count}>
            勾了 {picked.length} 個，共 {MODULES.length} 個
          </span>
        }
      >
        <div>
          {MODULES.map((module) => (
            <label key={module.key} className={styles.row}>
              <input
                type="checkbox"
                checked={picked.includes(module.key)}
                onChange={() => toggle(module.key)}
                className="mt-1"
              />
              <span className="min-w-0">
                <span className={styles.moduleLabel}>{module.label}</span>
                <span className={`${styles.moduleHint} block`}>{module.hint}</span>
              </span>
            </label>
          ))}
        </div>
        <span className={styles.hint}>沒勾的模組不會在表單留空位，也不會在詳情頁顯示「—」</span>
      </Section>

      <Section step="04" label="長出來會是這樣">
        <div className={styles.preview}>
          {picked.map((key) => (
            <span key={key} className={styles.previewItem}>
              {MODULES.find((m) => m.key === key)?.label}
            </span>
          ))}
        </div>
        <span className={styles.hint}>
          {`建立之後側欄的「${groupLabel}」底下多一項${name.trim() ? `「${name.trim()}」` : ""}`}
          {siblings.length > 0 && `，跟現有的 ${siblings.length} 種並列`}
        </span>
      </Section>

      <div className="pt-6">
        <FormActions
          saving={saving}
          saveLabel="建立"
          onCancel={() => router.back()}
          error={error}
        />
      </div>
    </form>
  );
}
