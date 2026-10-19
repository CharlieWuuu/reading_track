import { useEffect, useRef } from "react";
import { AUTOFILL_SOURCES } from "@/config/autofill-sources";
import { requestAutofill } from "@/features/overview/api/request-autofill";
import { Kind } from "@/lib/db/queries/kinds";
import { useAutofillStore } from "@/stores/use-autofill-store";
import { fillFields } from "@/utils/autofill";

const labelOf = (slug: string) => AUTOFILL_SOURCES.find((s) => s.slug === slug)?.label ?? slug;

/**
 * 把「自動補齊」登記給頁首按鈕。這個類型沒勾來源就不登記，按鈕也就不出現。
 *
 * 用標題去查，只補空欄位、只補這個類型勾了的——手動填的比查回來的可信。
 * values 放 ref：run 登記一次就好，不用每打一個字重登記。
 */
export function useAutofill({
  kind,
  values,
  setValues,
  fieldKeys,
  setNote,
}: {
  kind: Kind;
  values: Record<string, string>;
  setValues: (update: (v: Record<string, string>) => Record<string, string>) => void;
  fieldKeys: ReadonlySet<string>;
  setNote: (note: string) => void;
}) {
  const setRun = useAutofillStore((s) => s.setRun);
  const setBusy = useAutofillStore((s) => s.setBusy);
  // 最新的值放 ref：run 只登記一次，不用每打一個字（或每次 render 重算的 Set）就重登記
  const latest = useRef({ values, fieldKeys, sources: kind.autofill });
  useEffect(() => {
    latest.current = { values, fieldKeys, sources: kind.autofill };
  });

  const enabled = kind.autofill.length > 0;

  useEffect(() => {
    if (!enabled) return;

    async function run() {
      const { values, fieldKeys, sources } = latest.current;
      const title = values.title?.trim();
      if (!title) return setNote("先填標題");

      setBusy(true);
      setNote("");
      try {
        const found = await requestAutofill(sources, title, values.language?.trim());
        if (!found) return setNote(`查不到「${title}」`);

        const { filled } = fillFields(values, found.fields, fieldKeys);
        setValues((v) => fillFields(v, found.fields, fieldKeys).values);
        setNote(filled ? `從${labelOf(found.source)}補上 ${filled} 個欄位` : "沒有可補的欄位");
      } catch (err) {
        setNote(err instanceof Error ? err.message : "補齊失敗");
      } finally {
        setBusy(false);
      }
    }

    setRun(run);
    return () => setRun(null);
  }, [enabled, setValues, setNote, setRun, setBusy]);
}
