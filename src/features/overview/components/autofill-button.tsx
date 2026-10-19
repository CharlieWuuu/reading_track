"use client";

import { styles as controls } from "@/components/ui/controls/styles";
import { Kind } from "@/lib/db/queries/kinds";
import { useAutofillStore } from "@/stores/use-autofill-store";

/** 頁首的「自動補齊」。這個類型沒勾來源就不畫，查哪裡、補哪幾格都不讓使用者操心 */
export function AutofillButton({ kind }: { kind: Kind }) {
  const { run, busy } = useAutofillStore();
  if (kind.autofill.length === 0) return null;

  return (
    <button
      type="button"
      disabled={!run || busy}
      onClick={() => void run?.()}
      className={`${controls.primary} disabled:opacity-50`}
    >
      {busy ? "補齊中…" : "自動補齊"}
    </button>
  );
}
