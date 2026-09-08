"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field } from "@/components/ui/field";
import { FormActions } from "@/components/ui/form-actions";
import { FieldDef } from "@/config/record-fields";
import { scrapeUrl } from "@/features/overview/api/scrape-url";
import { Kind } from "@/lib/db/queries/kinds";
import { fieldsOf, FormModule, resolveFormModules } from "@/utils/record-form";

/**
 * 照類型勾的模組畫出來的表單。
 *
 * 一套渲染器服務所有類型——欄位不是寫死的，是模組展開來的。沒勾的模組不留空位，
 * 所以「旅遊」不會出現「頁數」，「書籍」不會出現「維基連結」。
 *
 * 一個模組可能對到好幾欄（狀態＝開始＋結束），標籤掛在模組上，
 * 所以多欄的模組第一欄用模組名，其餘用欄位自己的預設名。
 */

const INPUT_TYPE: Partial<Record<FieldDef["type"], string>> = {
  date: "date",
  number: "number",
  url: "url",
};

function ModuleFields({
  module,
  values,
  onChange,
  onUrlPaste,
}: {
  module: FormModule;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  /** 貼進「外部連結」欄的訊號，抓取器接不接看類型有沒有這個欄位 */
  onUrlPaste?: (url: string) => void;
}) {
  const fields = fieldsOf([module]);

  return (
    <>
      {fields.map((field, index) => (
        <Field
          key={field.key}
          label={index === 0 ? module.label : field.defaultLabel}
          hint={index === 0 ? module.hint : undefined}
          type={INPUT_TYPE[field.type] ?? "text"}
          value={values[field.key] ?? ""}
          onChange={(value) => onChange(field.key, value)}
          onPaste={field.key === "sourceUrl" ? onUrlPaste : undefined}
        />
      ))}
    </>
  );
}

/** 給了 recordId 就是編輯，沒給就是新增。兩者畫出來的欄位完全一樣 */
export function ModuleForm({
  kind,
  recordId,
  initial,
}: {
  kind: Kind;
  recordId?: string;
  initial?: Record<string, string>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(initial ?? {});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [fetching, setFetching] = useState(false);
  const [fetchNote, setFetchNote] = useState("");

  const modules = resolveFormModules(kind.modules);
  const fields = fieldsOf(modules);
  const set = (key: string, value: string) => setValues((v) => ({ ...v, [key]: value }));

  /**
   * 貼上外部連結時帶入標題與作者。用的是通用的 OG／JSON-LD 剖析器，不是
   * 各平台專用的書籍爬蟲——自訂類型沒有專屬剖析器，能拿到多少算多少。
   * 只補空欄位：手動改過的內容比抓回來的可信。
   */
  const canScrape =
    fields.some((f) => f.key === "sourceUrl") && fields.some((f) => f.key === "title");

  async function handleUrlPaste(url: string) {
    const trimmed = url.trim();
    if (!trimmed || !canScrape) return;

    setFetching(true);
    setFetchNote("");
    try {
      const found = await scrapeUrl(trimmed);
      let filled = 0;
      setValues((v) => {
        const next: Record<string, string> = { ...v, sourceUrl: trimmed };
        if (found.title && !next.title?.trim()) {
          next.title = found.title;
          filled += 1;
        }
        if (found.author && !next.creator?.trim()) {
          next.creator = found.author;
          filled += 1;
        }
        return next;
      });
      setFetchNote(filled ? `補上 ${filled} 個欄位` : "沒有可補的欄位");
    } catch (err) {
      setFetchNote(err instanceof Error ? err.message : "抓取失敗");
    } finally {
      setFetching(false);
    }
  }

  async function send(url: string, method: string, body: object, fallback: string) {
    setSaving(true);
    setError(undefined);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? fallback);
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : fallback);
      setSaving(false);
    }
  }

  const save = () =>
    recordId
      ? send(`/api/catalog/${recordId}`, "PATCH", { values }, "儲存失敗")
      : send(`/api/kinds/${kind.id}/records`, "POST", { values }, "新增失敗");

  const remove = () => send(`/api/catalog/${recordId}`, "DELETE", {}, "刪除失敗");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="flex max-w-2xl flex-col gap-4"
    >
      {modules.map((module) => (
        <ModuleFields
          key={module.key}
          module={module}
          values={values}
          onChange={set}
          onUrlPaste={canScrape ? handleUrlPaste : undefined}
        />
      ))}
      {fetching && <p className="text-xs text-gray-500">抓取中…</p>}
      {!fetching && fetchNote && <p className="text-xs text-gray-500">{fetchNote}</p>}
      <FormActions
        saving={saving}
        onCancel={() => router.back()}
        onDelete={recordId ? remove : undefined}
        error={error}
      />
    </form>
  );
}
