"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CoverCard } from "@/components/ui/cover-card/cover-card";
import { Field } from "@/components/ui/field/field";
import { FormActions } from "@/components/ui/form-actions";
import { FragmentCard } from "@/components/ui/fragment-card/fragment-card";
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
  frame: "flex min-h-0 min-w-0 flex-1 gap-10",
  main: "flex min-w-0 flex-1 flex-col overflow-y-auto",
  rail: "border-rule-strong hidden w-72 shrink-0 flex-col gap-4 overflow-y-auto border-l pl-6 lg:flex",
  railLabel: "text-label text-accent tracking-label font-medium",
  section: "flex flex-col gap-3 pt-6 first:pt-0",
  sectionHead: "border-rule-strong flex items-baseline gap-3 border-b-2 pb-1.5",
  step: "text-meta text-ink-faint tabular-nums",
  sectionLabel: "font-serif text-item-sm font-semibold tracking-wide",
  hint: "text-meta text-ink-faint",
  row: "border-rule flex items-start gap-3 border-b py-2.5",
  moduleLabel: "font-serif text-item-sm font-semibold",
  moduleHint: "text-meta text-ink-faint",
  count: "text-meta text-ink-faint tabular-nums ml-auto",
  chip: "rounded-control border-rule border px-3 py-1.5 text-sm font-medium hover:bg-gray-50",
  chipActive: "bg-accent border-accent text-white hover:bg-accent",
};

/** 依勾選的模組組出示意內容：紀錄用 CoverCard，片段／專欄用 FragmentCard——跟畫面上真正的畫法一致 */
function TypePreview({
  group,
  name,
  picked,
}: {
  group: KindGroup;
  name: string;
  picked: string[];
}) {
  const has = (key: string) => picked.includes(key);
  const title = name.trim() || "（類型名稱）";
  const body = has("longText")
    ? "這裡是長文內容，支援分欄……"
    : has("oneLine")
      ? "這裡是一句話的內容"
      : undefined;

  if (group === "records") {
    const caption = has("longText")
      ? "這裡是長文內容……"
      : [has("creator") && "作者／來源人", has("amount") && "量＋單位"].filter(Boolean).join("・");
    return (
      <div className="max-w-56">
        <CoverCard
          id="preview"
          title={title}
          caption={caption || undefined}
          meta={has("progress") || has("date") ? "2026-01-01" : undefined}
          coverUrl={has("cover") ? "" : undefined}
        />
      </div>
    );
  }

  return (
    <div className="max-w-72">
      <FragmentCard
        title={title}
        label={has("gloss") ? "解釋" : undefined}
        body={body}
        meta={has("locator") ? "出處・位置" : undefined}
        coverUrl={has("cover") ? "" : undefined}
      />
    </div>
  );
}

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

export function TypeBuilder({ group }: { group: KindGroup }) {
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
      className={styles.frame}
    >
      <div className={`${styles.main} max-w-2xl`}>
        <Section step="01" label="選擇類型">
          <div className="flex flex-wrap gap-2">
            {templates.map((template) => (
              <button
                key={template.key}
                type="button"
                onClick={() => applyTemplate(template)}
                aria-pressed={name === template.name}
                className={`${styles.chip} ${name === template.name ? styles.chipActive : ""}`}
              >
                {template.name}
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
              aria-pressed={!name}
              className={`${styles.chip} ${!name ? styles.chipActive : ""}`}
            >
              空白開始
            </button>
          </div>
        </Section>

        <Section
          step="02"
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

        <div className="pt-6">
          <FormActions
            saving={saving}
            saveLabel="建立"
            onCancel={() => router.back()}
            error={error}
          />
        </div>
      </div>

      <div className={styles.rail}>
        <div className="flex flex-col gap-3">
          <span className={styles.railLabel}>叫什麼</span>
          <Field label="名稱" value={name} onChange={setName} />
          <Field label="網址" value={slug} onChange={setSlug} />
          <Field label="量的單位" value={unit} onChange={setUnit} />
        </div>

        <span className={styles.railLabel}>長出來會是這樣</span>
        <TypePreview group={group} name={name} picked={picked} />
      </div>
    </form>
  );
}
