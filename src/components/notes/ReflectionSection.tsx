"use client";

import Link from "next/link";
import { GanttChartSquare, LayoutList } from "lucide-react";
import { PageMessage } from "@/components/layout/PageMessage";
import { ViewToggle } from "@/components/ui/Controls";
import { getReflectionKeywords, getReflections, Reflection } from "@/lib/reflections";
import { useArticles } from "@/lib/useArticles";
import { useEntries } from "@/lib/useEntries";
import { useUrlParams } from "@/lib/useUrlParam";
import { Book } from "@/types/book";
import { ReflectionTimeline } from "./ReflectionTimeline";

const styles = {
  wrap: "flex min-h-0 flex-1 flex-col gap-3",
  bar: "flex shrink-0 items-start justify-between gap-3",
  // 關鍵字可能很多，這一排自己捲，不要把下面的內容擠掉
  filters: "flex shrink-0 flex-wrap gap-1.5 md:max-h-20 md:overflow-y-auto",
  chip: "rounded-full border px-2.5 py-1 text-xs whitespace-nowrap",
  chipOn: "border-gray-900 bg-gray-900 text-white",
  chipOff: "border-gray-300 text-gray-600 hover:border-gray-500",
  count: "ml-1 text-[10px] opacity-60 tabular-nums",
  list: "flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto",
  card: "flex flex-col gap-1.5 rounded-lg border bg-white p-4 hover:border-gray-400",
  head: "flex items-baseline justify-between gap-2",
  title: "min-w-0 truncate text-sm font-medium",
  meta: "shrink-0 text-xs text-gray-400 tabular-nums",
  // 心得不截斷：這一頁存在的理由就是把它整段讀完
  note: "text-sm leading-relaxed whitespace-pre-wrap text-gray-700",
  tags: "flex flex-wrap gap-1 pt-0.5",
  tag: "rounded bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500",
};

const ICON = { size: 16, strokeWidth: 1.5 } as const;

const VIEWS = [
  { key: "list", label: "列表", Icon: () => <LayoutList {...ICON} /> },
  { key: "timeline", label: "時間軸", Icon: () => <GanttChartSquare {...ICON} /> },
] as const;

type View = (typeof VIEWS)[number]["key"];

/** 時間軸的圓點也照這個分，兩種看法的顏色要對得起來 */
export const SOURCE_TONES: Record<Reflection["source"], string> = {
  書籍: "bg-amber-100 text-amber-800",
  文章: "bg-blue-100 text-blue-800",
  紀事: "bg-emerald-100 text-emerald-800",
};

/**
 * 跨書籍、文章、紀事的心得，按時間攤開。
 *
 * 統計回答的是「我做了多少」，這一頁回答的是「我一直在想什麼」——
 * 所以這裡刻意不畫圖，就是一串可以從頭讀到尾的文字。
 */
export function ReflectionSection({ books }: { books: Book[] }) {
  const { articles } = useArticles();
  const { entries } = useEntries();
  const { searchParams, setParams } = useUrlParams();

  const all = getReflections(books, articles, entries);
  const keywords = getReflectionKeywords(all);
  const selected = searchParams.get("keyword");
  const viewParam = searchParams.get("view");
  const view: View = viewParam === "timeline" ? "timeline" : "list";
  const reflections = selected ? all.filter((r) => r.keywords.includes(selected)) : all;

  if (all.length === 0) {
    return <PageMessage>還沒有寫下任何心得</PageMessage>;
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.bar}>
        <div className={styles.filters}>
          <button
            onClick={() => setParams({ keyword: null })}
            className={`${styles.chip} ${selected ? styles.chipOff : styles.chipOn}`}
          >
            全部
            <span className={styles.count}>{all.length}</span>
          </button>
          {keywords.map((k) => (
            <button
              key={k.name}
              // 再點一次同一個就取消，不用特地跑回「全部」
              onClick={() => setParams({ keyword: selected === k.name ? null : k.name })}
              className={`${styles.chip} ${selected === k.name ? styles.chipOn : styles.chipOff}`}
            >
              {k.name}
              <span className={styles.count}>{k.count}</span>
            </button>
          ))}
        </div>

        <ViewToggle
          items={VIEWS}
          value={view}
          onChange={(next) => setParams({ view: next === "list" ? null : next })}
        />
      </div>

      {view === "timeline" ? (
        <ReflectionTimeline reflections={reflections} />
      ) : (
        <div className={styles.list}>
          {reflections.map((r) => (
            <Link key={`${r.source}-${r.id}`} href={r.href} className={styles.card}>
              <div className={styles.head}>
                <span className={styles.title}>
                  <span
                    className={`mr-1.5 rounded px-1.5 py-0.5 text-[11px] ${SOURCE_TONES[r.source]}`}
                  >
                    {r.kind || r.source}
                  </span>
                  {r.title}
                </span>
                <span className={styles.meta}>{r.date ?? "未填日期"}</span>
              </div>

              <p className={styles.note}>{r.note}</p>

              {r.keywords.length > 0 && (
                <div className={styles.tags}>
                  {r.keywords.map((name) => (
                    <span key={name} className={styles.tag}>
                      {name}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
