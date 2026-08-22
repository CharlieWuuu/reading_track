"use client";

import { Suspense } from "react";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { PageMessage } from "@/components/layout/page-message";
import { ActionButton } from "@/components/ui/controls";
import { SearchBar } from "@/components/ui/search-bar";
import { ReflectionTimeline } from "@/features/notes/components/reflection-timeline";
import { WritingFilter } from "@/features/writing/components/writing-filter";
import { useMounted } from "@/hooks/use-mounted";
import { useUrlParams } from "@/hooks/use-url-param";
import { useWritings } from "@/hooks/use-writings";
import { splitTags } from "@/types/book";
import { Writing } from "@/types/writing";
import { journalToReflections } from "@/utils/reflections";
import { matchesSearch, searchTerms } from "@/utils/search";

/** 選項只列真的有紀事在用的值，選了才不會篩出一片空白 */
function usedKinds(writings: Writing[]): string[] {
  return [...new Set(writings.flatMap((e) => splitTags(e.kind)))].sort((a, b) =>
    a.localeCompare(b, "zh-Hant"),
  );
}

function WritingList() {
  const mounted = useMounted();
  const { writings: allWriting, isLoading, error } = useWritings();
  const { searchParams, setParams } = useUrlParams();

  const kind = searchParams.get("kind") ?? "";
  const query = searchParams.get("q") ?? "";
  const terms = searchTerms(query);
  // 標題、內文、關鍵字都算：想得起來的可能是任何一個，內文更是常常只記得半句
  const writings = allWriting.filter(
    (e) =>
      (!kind || e.kind === kind) &&
      matchesSearch(terms, e.title, e.note, e.keywords, e.kind, e.sourceTitle),
  );

  const action = (
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <SearchBar value={query} onChange={(next) => setParams({ q: next || null })} />
      <WritingFilter
        groups={[{ key: "kind", label: "類型", options: usedKinds(allWriting), value: kind }]}
        onChange={(key, next) => setParams({ [key]: next || null })}
      />
      <ActionButton href="/writing/new">新增</ActionButton>
    </div>
  );
  if (!mounted) return null;

  const empty = isLoading || error || writings.length === 0;

  // 頁首兩個分支都一樣，畫一次就好
  return (
    <>
      <PageHeader title="書寫" action={action} />
      {empty ? (
        <PageMessage tone={error ? "error" : "muted"}>
          {isLoading ? "載入中…" : error || "符合條件的書寫是空的"}
        </PageMessage>
      ) : (
        <PageBody>
          {/* 沒寫心得的也要看得到：這裡是紀事本身的清單 */}
          <ReflectionTimeline reflections={journalToReflections(writings, false)} />
        </PageBody>
      )}
    </>
  );
}

/** 底下讀網址參數的元件要有 Suspense 邊界，靜態預先產生才不會失敗 */
export default function WritingPage() {
  return (
    <Suspense fallback={null}>
      <WritingList />
    </Suspense>
  );
}
