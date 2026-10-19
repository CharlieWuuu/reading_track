import { AutofillButton } from "@/features/overview/components/autofill-button";
import { FormTabSwitch } from "@/features/overview/components/form-tab-switch";
import { Kind } from "@/lib/db/queries/kinds";

/** 表單頁首右側：自動補齊（有勾來源才有）加手機的分頁切換 */
export function FormHeaderActions({ kind }: { kind: Kind }) {
  return (
    <div className="flex items-center gap-3">
      <AutofillButton kind={kind} />
      <FormTabSwitch kind={kind} />
    </div>
  );
}
