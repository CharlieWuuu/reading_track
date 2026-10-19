import { useState } from "react";
import { OptionSelect } from "@/components/ui/option-select";
import {
  ALL_AUTOFILL_SOURCES,
  AUTOFILL_SOURCES,
  AutofillSlug,
  knownSources,
} from "@/config/autofill-sources";

const styles = {
  cell: "flex min-w-40 items-start gap-3 py-2.5",
  label: "font-serif text-item-sm font-semibold",
};

const labelOf = (slug: string) => AUTOFILL_SOURCES.find((s) => s.slug === slug)?.label ?? slug;
const slugOf = (label: string) => AUTOFILL_SOURCES.find((s) => s.label === label)?.slug ?? label;

/**
 * 補齊按鈕：勾了，表單頁首才有按鈕；下拉選單挑要參考哪幾家，依清單順序問，
 * 第一家查到的為止。一家都沒挑等於沒有按鈕。
 */
export function KindAutofillFields({
  value,
  onChange,
}: {
  value: AutofillSlug[];
  onChange: (next: AutofillSlug[]) => void;
}) {
  // 剛勾起來、還沒挑的時候 value 是空的，所以要自己記著「勾了」
  const [forced, setForced] = useState(false);
  const on = forced || value.length > 0;

  const toggle = () => {
    setForced(!on);
    onChange(on ? [] : ALL_AUTOFILL_SOURCES);
  };

  return (
    <>
      <label className={styles.cell}>
        <input type="checkbox" checked={on} onChange={toggle} className="mt-1" />
        <span className={styles.label}>補齊按鈕</span>
      </label>
      {on && (
        <div className="basis-full">
          <OptionSelect
            label="來源"
            hideLabel
            multiple
            creatable={false}
            options={AUTOFILL_SOURCES.map((s) => s.label)}
            value={value.map(labelOf).join("、")}
            onChange={(next) =>
              onChange(knownSources(next.split("、").filter(Boolean).map(slugOf)))
            }
            placeholder="選擇要參考的來源"
          />
        </div>
      )}
    </>
  );
}
