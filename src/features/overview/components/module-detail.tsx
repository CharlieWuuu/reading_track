"use client";

import { DetailField, DetailFields } from "@/components/ui/detail";
import { Kind } from "@/lib/db/queries/kinds";
import { detailFields } from "@/utils/detail-fields";

/**
 * 照類型勾的模組畫出來的詳情頁。ModuleForm 的唯讀版。
 *
 * 版式照設計稿 WritingDetail：類型與日期一行小字、大標、底下一條線，
 * 內文襯線寬行距，其餘欄位排成資訊表。標題不放頁首——一則紀錄的標題可以很長，
 * 擠在麵包屑那一行會被動作按鈕蓋掉。
 */

const styles = {
  frame: "flex max-w-2xl flex-col",
  head: "border-rule-strong border-b pb-4",
  tag: "text-label text-accent tracking-label font-medium",
  title: "font-serif text-lede mt-2 leading-tight font-semibold tracking-tight",
  meta: "text-meta text-ink-faint mt-2",
  body: "font-serif text-[15px] leading-[2.1] whitespace-pre-wrap text-gray-800 pt-5",
  fields: "pt-6",
};

export function ModuleDetail({ kind, values }: { kind: Kind; values: Record<string, string> }) {
  const { longs, shorts } = detailFields(kind, values);

  const tag = [kind.name, values.endDate].filter(Boolean).join(" · ");

  return (
    <div className={styles.frame}>
      <div className={styles.head}>
        {tag && <span className={styles.tag}>{tag}</span>}
        {values.title && <h1 className={styles.title}>{values.title}</h1>}
      </div>

      {longs.map((field) => (
        <p key={field.key} className={styles.body}>
          {field.value}
        </p>
      ))}

      {shorts.length > 0 && (
        <div className={styles.fields}>
          <DetailFields>
            {shorts.map((field) => (
              <DetailField key={field.key} label={field.label}>
                {field.value}
              </DetailField>
            ))}
          </DetailFields>
        </div>
      )}
    </div>
  );
}
