"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Field } from "@/components/ui/field";
import { FormActions } from "@/components/ui/form-actions";
import { FieldDef } from "@/config/record-fields";
import { Kind } from "@/lib/db/queries/kinds";
import { fieldsOf, FormModule, resolveFormModules } from "@/utils/record-form";

/**
 * 照類型勾的模組畫出來的表單。
 *
 * 一套渲染器服務所有類型——欄位不是寫死的，是模組展開來的。沒勾的模組不留空位，
 * 所以「旅遊」不會出現「頁數」，「書籍」不會出現「維基連結」。
 *
 * 一個模組可能對到好幾欄（進度與狀態＝開始＋結束），標籤掛在模組上，
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
}: {
  module: FormModule;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
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

  const modules = resolveFormModules(kind.modules);
  const set = (key: string, value: string) => setValues((v) => ({ ...v, [key]: value }));

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
        <ModuleFields key={module.key} module={module} values={values} onChange={set} />
      ))}
      <FormActions
        saving={saving}
        onCancel={() => router.back()}
        onDelete={recordId ? remove : undefined}
        error={error}
      />
    </form>
  );
}
