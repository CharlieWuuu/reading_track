import { KindDisplay } from "@/config/kind-display";

const styles = {
  grid: "flex flex-wrap gap-x-6",
  cell: "flex min-w-40 flex-1 items-start gap-3 py-2.5",
  label: "font-serif text-item-sm font-semibold",
};

/**
 * 類型的顯示設定：重讀計次。
 *
 * 只有紀錄有——作品與紀錄分兩層，同一本書讀兩次才是兩筆；片段與書寫一筆就是一件。
 */
export function KindDisplayFields({
  value,
  onChange,
}: {
  value: KindDisplay;
  onChange: (next: KindDisplay) => void;
}) {
  return (
    <div className={styles.grid}>
      <label className={styles.cell}>
        <input
          type="checkbox"
          checked={value.countRereads}
          onChange={() => onChange({ ...value, countRereads: !value.countRereads })}
          className="mt-1"
        />
        <span className={styles.label}>計算重讀次數</span>
      </label>
    </div>
  );
}
