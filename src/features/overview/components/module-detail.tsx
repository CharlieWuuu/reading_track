"use client";

import Link from "next/link";
import { DetailField, DetailFields } from "@/components/ui/detail";
import { kindHref } from "@/config/kind-routes";
import { Kind } from "@/lib/db/queries/kinds";
import { fieldsOf, FormModule, resolveFormModules } from "@/utils/record-form";

/**
 * 照類型勾的模組畫出來的詳情頁。ModuleForm 的唯讀版。
 *
 * 沒有這一支的話，點進一筆紀錄直接看到編輯表單——那是兩件事：看跟改。
 * 一套渲染器服務所有類型，跟表單同一份模組設定，不會出現「詳情少一欄」。
 */

const styles = {
  frame: "flex max-w-2xl flex-col gap-5",
  longText: "font-serif text-[15px] leading-[1.9] whitespace-pre-wrap text-gray-800 md:text-base",
  edit: "text-meta text-ink-faint hover:text-ink self-start",
};

/** 長文自己一段，不擠進兩欄的資訊表——一段文章塞進半個欄寬讀不下去 */
const LONG_KEYS = new Set(["body"]);

export function ModuleDetail({
  kind,
  recordId,
  values,
}: {
  kind: Kind;
  recordId: string;
  values: Record<string, string>;
}) {
  const modules = resolveFormModules(kind.modules);
  const labelOf = (form: FormModule, index: number, fallback: string) =>
    index === 0 ? form.label : fallback;

  const longs: { key: string; label: string; value: string }[] = [];
  const shorts: { key: string; label: string; value: string }[] = [];

  for (const form of modules) {
    fieldsOf([form]).forEach((field, index) => {
      const value = values[field.key] ?? "";
      if (!value) return;
      const entry = { key: field.key, label: labelOf(form, index, field.defaultLabel), value };
      (LONG_KEYS.has(field.key) ? longs : shorts).push(entry);
    });
  }

  return (
    <div className={styles.frame}>
      {longs.map((field) => (
        <p key={field.key} className={styles.longText}>
          {field.value}
        </p>
      ))}

      <DetailFields>
        {shorts.map((field) => (
          <DetailField key={field.key} label={field.label}>
            {field.value}
          </DetailField>
        ))}
      </DetailFields>

      <Link href={`${kindHref(kind.group, kind.slug)}/${recordId}/edit`} className={styles.edit}>
        編輯
      </Link>
    </div>
  );
}
