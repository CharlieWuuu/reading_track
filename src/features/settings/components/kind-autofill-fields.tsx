import { AUTOFILL_SOURCES, AutofillSlug } from "@/config/autofill-sources";

const styles = {
  grid: "flex flex-wrap gap-x-6",
  cell: "flex min-w-40 flex-1 items-start gap-3 py-2.5",
  label: "font-serif text-item-sm font-semibold",
};

/** 類型的補齊來源。一個都沒勾，表單就不出「自動補齊」按鈕 */
export function KindAutofillFields({
  value,
  onChange,
}: {
  value: AutofillSlug[];
  onChange: (next: AutofillSlug[]) => void;
}) {
  const toggle = (slug: AutofillSlug) =>
    onChange(
      AUTOFILL_SOURCES.map((s) => s.slug).filter((s) =>
        s === slug ? !value.includes(s) : value.includes(s),
      ),
    ); // 依來源表的順序存，查詢順序就是它的順序

  return (
    <div className={styles.grid}>
      {AUTOFILL_SOURCES.map((source) => (
        <label key={source.slug} className={styles.cell}>
          <input
            type="checkbox"
            checked={value.includes(source.slug)}
            onChange={() => toggle(source.slug)}
            className="mt-1"
          />
          <span className={styles.label}>{source.label}</span>
        </label>
      ))}
    </div>
  );
}
