const styles = {
  block: "flex flex-col",
  head: "border-rule-strong border-b pb-2",
  label: "text-label text-ink",
  row: "border-rule-soft text-ui border-b py-1.5 text-left last:border-b-0",
  on: "font-serif font-semibold text-ink",
  off: "text-ink-muted hover:text-ink",
};

type DomainFilterProps = {
  domains: readonly string[];
  value: string | null; // null 是全部
  onToggle: (domain: string) => void; // 點已選的那個就取消
};

/** 概覽右欄的領域篩選，單選 */
export function DomainFilter({ domains, value, onToggle }: DomainFilterProps) {
  if (domains.length === 0) return null;
  return (
    <div className={styles.block}>
      <div className={styles.head}>
        <span className={styles.label}>領域</span>
      </div>
      {domains.map((domain) => (
        <button
          key={domain}
          type="button"
          aria-pressed={domain === value}
          onClick={() => onToggle(domain)}
          className={`${styles.row} ${domain === value ? styles.on : styles.off}`}
        >
          {domain}
        </button>
      ))}
    </div>
  );
}
