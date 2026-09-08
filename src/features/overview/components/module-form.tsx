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

export function ModuleForm({ kind }: { kind: Kind }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const modules = resolveFormModules(kind.modules);
  const set = (key: string, value: string) => setValues((v) => ({ ...v, [key]: value }));

  async function save() {
    setSaving(true);
    setError(undefined);
    try {
      const res = await fetch(`/api/kinds/${kind.id}/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "新增失敗");
      router.back();
    } catch (err) {
      setError(err instanceof Error ? err.message : "新增失敗");
      setSaving(false);
    }
  }

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
      <FormActions saving={saving} onCancel={() => router.back()} error={error} />
    </form>
  );
}
