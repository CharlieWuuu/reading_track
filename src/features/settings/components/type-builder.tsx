"use client";

import { useRouter } from "next/navigation";
import { Fragment, useState } from "react";
import { CoverCard } from "@/components/ui/cover-card/cover-card";
import { FIELD_INPUT_CLASS } from "@/components/ui/field-label/field-label";
import { Field } from "@/components/ui/field/field";
import { FormActions } from "@/components/ui/form-actions";
import { FragmentCard } from "@/components/ui/fragment-card/fragment-card";
import { KindTemplate, templatesOf } from "@/config/kind-templates";
import { MODULES } from "@/config/modules";
import { KindGroup } from "@/config/record-kinds";
import { useKinds } from "@/hooks/use-kinds";
import { Kind } from "@/lib/db/queries/kinds";

/** 每個類型都有的那幾個不列出來——列了也不能取消勾，只會讓人以為關得掉 */
const PICKABLE = MODULES.filter((module) => !("always" in module));

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
  railLabel: "text-label text-accent font-medium",
  section: "flex flex-col gap-3 pt-6 first:pt-0",
  sectionHead: "border-rule-strong flex items-baseline gap-3 border-b-2 pb-1.5",
  step: "text-meta text-ink-faint tabular-nums",
  sectionLabel: "font-serif text-item-sm font-semibold",
  hint: "text-meta text-ink-faint",
  row: "border-rule flex items-start gap-3 border-b py-2.5",
  // 模組名字都很短，一欄一列把整頁拉得很長。不寫死兩欄：放得下就併排，
  // 放不下自己換行——最長的是「沿用出處的封面」，窄螢幕硬擠兩欄會斷字
  moduleGrid: "flex flex-wrap gap-x-6",
  moduleCell: "min-w-40 flex-1",
  moduleLabel: "font-serif text-item-sm font-semibold",
  // 單位只填一兩個字（頁、分鐘），跟模組名字並排，不要撐滿整列
  unitInput: "w-20 text-sm",
  count: "text-meta text-ink-faint tabular-nums ml-auto",
  // 範本一行一列，跟側欄同一種長相：整行可點，不畫框不上底色，
  // 選中的那一列靠字本身放大變粗表示——一排 chip 每顆只有幾個字寬，不好點
  pickRow: "border-rule-soft flex w-full items-baseline border-b py-[7px] pl-3 text-left",
  pickLabel: "text-ui truncate",
  pickActive: "font-serif text-item-sm text-ink font-semibold",
  pickIdle: "text-ink-muted",
  pickHint: "text-meta text-ink-faint ml-auto pl-2",
};

/** 依勾選的模組組出示意內容：紀錄用 CoverCard，片段／書寫用 FragmentCard——跟畫面上真正的畫法一致 */
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
  const body = has("longText") ? "這裡是長文內容，支援分欄……" : undefined;

  if (group === "records") {
    const caption = has("longText")
      ? "這裡是長文內容……"
      : [has("creator") && "作者／來源人", has("amount") && "量"].filter(Boolean).join("・");
    return (
      <div className="max-w-56">
        <CoverCard
          id="preview"
          title={title}
          caption={caption || undefined}
          meta={has("startDate") || has("endDate") ? "2026-01-01" : undefined}
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

/**
 * 新增或修改一個類型。
 *
 * 給了 editing 就是改那一個，帶入它現在的設定；不給就是從空白建一個新的。
 * onDone 不給就回上一頁——這支本來是獨立頁，收在面板裡展開時要的是收起來。
 */
export function TypeBuilder({
  group,
  editing,
  onDone,
}: {
  group: KindGroup;
  editing?: Kind;
  onDone?: () => void;
}) {
  const router = useRouter();
  const done = onDone ?? (() => router.back());
  const { kinds, addKind, editKind } = useKinds();
  const [name, setName] = useState(editing?.name ?? "");
  const [slug, setSlug] = useState(editing?.slug ?? "");
  const [unit, setUnit] = useState(editing?.amountUnit ?? "");
  const [inheritsCover, setInheritsCover] = useState(editing?.inheritsCover ?? false);
  const [picked, setPicked] = useState<string[]>(
    editing ? editing.modules.map((m) => m.key) : ["title"],
  );
  const [labels, setLabels] = useState<Record<string, string>>(
    editing ? Object.fromEntries(editing.modules.map((m) => [m.key, m.label])) : {},
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const toggle = (key: string) =>
    setPicked((keys) => (keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key]));

  const siblings = kinds.filter((kind) => kind.group === group && kind.id !== editing?.id);
  const taken = new Set(siblings.map((kind) => kind.name));
  /** 範本是常駐的：刪掉「書籍」還能再套一次。已經有的就不重複列 */
  const templates = templatesOf(group).filter((template) => !taken.has(template.name));

  function applyTemplate(template: KindTemplate) {
    setName(template.name);
    setSlug(template.key);
    setUnit(template.amountUnit);
    setInheritsCover(template.inheritsCover ?? false);
    setPicked([...template.modules]);
    setLabels({ ...template.labels });
  }

  async function save() {
    setSaving(true);
    setError(undefined);
    const values = {
      name: name.trim(),
      slug: slug.trim(),
      modules: picked,
      amountUnit: unit.trim(),
      inheritsCover,
      labels,
    };

    try {
      if (editing) await editKind(editing.id, values);
      else await addKind(group, values);
      done();
    } catch (err) {
      setError(err instanceof Error ? err.message : editing ? "儲存失敗" : "新增類型失敗");
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
        <Section step="01" label="名稱">
          {/* 名稱與網址是同一件事的兩種寫法，並排看得到彼此。
              欄名收進 placeholder：Field 預設標籤與輸入框橫排，兩格並排就變四欄，
              每格只剩三十幾 px，「關鍵字」三個字都放不下 */}
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
            <div className="min-w-0 flex-1">
              <Field label="名稱" hideLabel value={name} onChange={setName} />
            </div>
            <div className="min-w-0 flex-1">
              <Field label="網址" hideLabel value={slug} onChange={setSlug} />
            </div>
          </div>
        </Section>

        {/* 套範本會把現在的設定蓋掉，所以只在新增時出現 */}
        {!editing && (
          <Section step="02" label="選擇類型">
            <div>
              {templates.map((template) => {
                const on = name === template.name;
                return (
                  <button
                    key={template.key}
                    type="button"
                    onClick={() => applyTemplate(template)}
                    aria-pressed={on}
                    className={styles.pickRow}
                  >
                    <span
                      className={`${styles.pickLabel} ${on ? styles.pickActive : styles.pickIdle}`}
                    >
                      {template.name}
                    </span>
                    <span className={styles.pickHint}>{template.modules.length} 個模組</span>
                  </button>
                );
              })}
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
                className={styles.pickRow}
              >
                <span
                  className={`${styles.pickLabel} ${!name ? styles.pickActive : styles.pickIdle}`}
                >
                  空白開始
                </span>
              </button>
            </div>
          </Section>
        )}

        <Section
          step={editing ? "02" : "03"}
          label="欄位"
          hint={
            <span className={styles.count}>
              勾了 {picked.length} 個，共 {PICKABLE.length} 個
            </span>
          }
        >
          <div className={styles.moduleGrid}>
            {PICKABLE.map((module) => (
              <Fragment key={module.key}>
                <label className={`${styles.row} ${styles.moduleCell}`}>
                  <input
                    type="checkbox"
                    checked={picked.includes(module.key)}
                    onChange={() => toggle(module.key)}
                    className="mt-1"
                  />
                  <span className={styles.moduleLabel}>{module.label}</span>
                </label>
                {/* 單位是「量」的一部分，不是另一個模組：沒勾量就沒有單位可填。
                    本來擺在最上面跟名稱、網址並列，但那三格只有它是條件性的 */}
                {module.key === "amount" && picked.includes("amount") && (
                  <label className={`${styles.row} ${styles.moduleCell}`}>
                    <span className={styles.moduleLabel}>單位</span>
                    <input
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="頁"
                      aria-label="單位"
                      className={`${FIELD_INPUT_CLASS} ${styles.unitInput}`}
                    />
                  </label>
                )}
                {/* 不是封面圖的子選項，是它的替代：自己放圖的類型不繼承，繼承的不自己放圖。
                    排在它後面只是因為兩個都在講圖，所以不縮排 */}
                {module.key === "cover" && (
                  <label className={`${styles.row} ${styles.moduleCell}`}>
                    <input
                      type="checkbox"
                      checked={inheritsCover}
                      onChange={() => setInheritsCover((on) => !on)}
                      className="mt-1"
                    />
                    <span className={styles.moduleLabel}>沿用出處的封面</span>
                  </label>
                )}
              </Fragment>
            ))}
          </div>
        </Section>

        <div className="pt-6">
          <FormActions
            saving={saving}
            saveLabel={editing ? "儲存" : "建立"}
            onCancel={done}
            error={error}
          />
        </div>
      </div>

      <div className={styles.rail}>
        <span className={styles.railLabel}>長出來會是這樣</span>
        <TypePreview group={group} name={name} picked={picked} />
      </div>
    </form>
  );
}
