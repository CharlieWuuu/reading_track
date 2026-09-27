import { ExternalLink } from "lucide-react";
import { Favicon } from "@/components/ui/favicon";
import { DetailEntry } from "@/utils/detail-fields";
import { isUrl } from "@/utils/reflections";
import { DetailField } from "./detail";

const styles = {
  empty: "text-ink-faint", // 空的也列，看得出哪裡還沒填
  link: "inline-flex items-center gap-1 text-blue-700 underline underline-offset-2 hover:text-blue-900",
  publisher: "inline-flex items-center gap-1.5",
};

function FactValue({ entry, sourceUrl }: { entry: DetailEntry; sourceUrl: string }) {
  if (!entry.value.trim()) return <span className={styles.empty}>—</span>;
  if (entry.key === "externalUrl" && isUrl(entry.value)) {
    return (
      <a
        href={entry.value}
        target="_blank"
        rel="noopener noreferrer"
        title={entry.value}
        className={styles.link}
      >
        原始頁面
        <ExternalLink size={12} strokeWidth={1.5} aria-hidden />
      </a>
    );
  }
  if (entry.key === "publisher" && sourceUrl) {
    return (
      <span className={styles.publisher}>
        <Favicon url={sourceUrl} fallback={entry.value} className="size-4" />
        {entry.value}
      </span>
    );
  }
  return <>{entry.value}</>;
}

// 詳情頁的資料卡：類型勾了幾欄就列幾列，照設定頁的名字與順序
export function KindFacts({
  entries,
  sourceUrl = "",
  align = "right",
}: {
  entries: readonly DetailEntry[];
  sourceUrl?: string; // 發行旁邊的網站圖示照這個網址抓
  align?: "left" | "right";
}) {
  return (
    <>
      {entries.map((entry) => (
        <DetailField key={entry.key} label={entry.label} align={align}>
          <FactValue entry={entry} sourceUrl={sourceUrl} />
        </DetailField>
      ))}
    </>
  );
}
