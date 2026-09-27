import { CARD_GROUPINGS, KindDisplay } from "@/config/kind-display";
import { KindGroup } from "@/config/record-kinds";

const styles = {
  grid: "flex flex-wrap gap-x-6",
  cell: "flex min-w-40 flex-1 items-start gap-3 py-2.5",
  label: "font-serif text-item-sm font-semibold",
};

/**
 * 類型的顯示設定：卡片牆分段、重讀計次、讀完編號。
 *
 * 重讀只有紀錄有——作品與紀錄分兩層，同一本書讀兩次才是兩筆；片段與書寫一筆就是一件。
 * 讀完編號要有完成日期才排得出順序，沒勾那個模組就不列。
 */
export function KindDisplayFields({
  group,
  picked,
  value,
  onChange,
}: {
  group: KindGroup;
  picked: string[];
  value: KindDisplay;
  onChange: (next: KindDisplay) => void;
}) {
  const set = (patch: Partial<KindDisplay>) => onChange({ ...value, ...patch });

  return (
    <div className={styles.grid}>
      {CARD_GROUPINGS.map((grouping) => (
        <label key={grouping.key} className={styles.cell}>
          <input
            type="radio"
            name="card-group-by"
            checked={value.cardGroupBy === grouping.key}
            onChange={() => set({ cardGroupBy: grouping.key })}
            className="mt-1"
          />
          <span className={styles.label}>卡片{grouping.label}分段</span>
        </label>
      ))}
      {group === "records" && (
        <label className={styles.cell}>
          <input
            type="checkbox"
            checked={value.countRereads}
            onChange={() => set({ countRereads: !value.countRereads })}
            className="mt-1"
          />
          <span className={styles.label}>計算重讀次數</span>
        </label>
      )}
      {picked.includes("endDate") && (
        <label className={styles.cell}>
          <input
            type="checkbox"
            checked={value.numberDone}
            onChange={() => set({ numberDone: !value.numberDone })}
            className="mt-1"
          />
          <span className={styles.label}>完成的依序編號</span>
        </label>
      )}
    </div>
  );
}
