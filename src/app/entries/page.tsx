"use client";

import Link from "next/link";
import { Suspense } from "react";
import { GanttChartSquare, LayoutList } from "lucide-react";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageMessage } from "@/components/layout/PageMessage";
import { ReflectionTimeline } from "@/components/notes/ReflectionTimeline";
import { ActionButton, TabBar, ViewToggle } from "@/components/ui/Controls";
import { TagList } from "@/components/ui/TagBadge";
import { entriesToReflections } from "@/lib/reflections";
import { useCategories } from "@/lib/useCategories";
import { useEntries } from "@/lib/useEntries";
import { useMounted } from "@/lib/useMounted";
import { useUrlParams } from "@/lib/useUrlParam";
import { splitLines } from "@/types/book";

const ICON = { size: 16, strokeWidth: 1.5 } as const;

/** 同一批紀事的兩種畫法：一列一筆，或以週為單位掛在數線上 */
const VIEWS = [
  { key: "list", label: "列表", Icon: () => <LayoutList {...ICON} /> },
  { key: "timeline", label: "數線", Icon: () => <GanttChartSquare {...ICON} /> },
] as const;

type View = (typeof VIEWS)[number]["key"];

function EntriesList() {
  const mounted = useMounted();
  const { entries: allEntries, isLoading, error } = useEntries();
  const { categories } = useCategories();
  const { searchParams, setParams } = useUrlParams();

  // 分頁列直接由「類型」的選項長出來，加一種類型不用改程式
  const kinds = categories.kind;
  const param = searchParams.get("kind");
  const kind = param && kinds.includes(param) ? param : "all";
  const filters = [{ key: "all", label: "全部" }, ...kinds.map((k) => ({ key: k, label: k }))];
  const entries = kind === "all" ? allEntries : allEntries.filter((e) => e.kind === kind);

  const viewParam = searchParams.get("view");
  const view: View = viewParam === "timeline" ? "timeline" : "list";

  const action = (
    <div className="flex min-w-0 items-center gap-2">
      <TabBar
        items={filters}
        value={kind}
        onChange={(next) => setParams({ kind: next === "all" ? null : next })}
      />
      <ViewToggle
        items={VIEWS}
        value={view}
        onChange={(next) => setParams({ view: next === "list" ? null : next })}
      />
      <ActionButton href="/entries/new">新增紀事</ActionButton>
    </div>
  );
  if (!mounted) return null;

  if (isLoading || error || entries.length === 0) {
    return (
      <>
        <PageHeader title="紀事" action={action} />
        <PageMessage tone={error ? "error" : "muted"}>
          {isLoading ? "載入中…" : error || "符合條件的紀事是空的"}
        </PageMessage>
      </>
    );
  }

  return (
    <>
      <PageHeader title="紀事" action={action} />
      <PageBody>
        {view === "timeline" ? (
          // 沒寫心得的也要看得到：這裡是紀事本身的清單，不是回顧
          <ReflectionTimeline reflections={entriesToReflections(entries, false)} />
        ) : (
          /* 版面同文章清單：桌機只捲清單本身，手機整頁捲 */
          <div className="shrink-0 divide-y overflow-hidden rounded-lg border bg-white md:min-h-0 md:flex-1 md:overflow-y-auto">
            {entries.map((e) => (
              <Link
                key={e.id}
                href={`/entries/${e.id}/edit`}
                className="flex flex-col gap-1 px-3 py-2.5 hover:bg-gray-50 sm:px-4 sm:py-3"
              >
                <p className="truncate text-sm font-medium whitespace-nowrap">{e.title}</p>

                {/* 心得是主體，清單上就先給一行，回顧時不用每筆都點進去 */}
                {e.note && <p className="truncate text-xs text-gray-600">{e.note}</p>}

                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="shrink-0 truncate text-xs text-gray-500">
                    {[e.date, e.kind, e.domain].filter(Boolean).join(" · ")}
                  </span>
                  {splitLines(e.keywords).length > 0 && (
                    <div className="min-w-0 overflow-hidden">
                      <TagList values={splitLines(e.keywords)} tone="article" wrap={false} />
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </PageBody>
    </>
  );
}

/** 底下讀網址參數的元件要有 Suspense 邊界，靜態預先產生才不會失敗 */
export default function EntriesPage() {
  return (
    <Suspense fallback={null}>
      <EntriesList />
    </Suspense>
  );
}
