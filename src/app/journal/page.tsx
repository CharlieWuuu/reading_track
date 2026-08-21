"use client";

import { Suspense } from "react";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { PageMessage } from "@/components/layout/page-message";
import { ActionButton } from "@/components/ui/controls";
import { SearchButton } from "@/components/ui/search-button";
import { JournalFilter } from "@/features/journal/components/journal-filter";
import { ReflectionTimeline } from "@/features/notes/components/reflection-timeline";
import { useJournal } from "@/hooks/use-journal";
import { useMounted } from "@/hooks/use-mounted";
import { useUrlParams } from "@/hooks/use-url-param";
import { splitTags } from "@/types/book";
import { JournalEntry } from "@/types/journal";
import { journalToReflections } from "@/utils/reflections";
import { matchesSearch, searchTerms } from "@/utils/search";

/** 選項只列真的有紀事在用的值，選了才不會篩出一片空白 */
function usedKinds(journal: JournalEntry[]): string[] {
  return [...new Set(journal.flatMap((e) => splitTags(e.kind)))].sort((a, b) =>
    a.localeCompare(b, "zh-Hant"),
  );
}

function JournalList() {
  const mounted = useMounted();
  const { journal: allJournal, isLoading, error } = useJournal();
  const { searchParams, setParams } = useUrlParams();

  const kind = searchParams.get("kind") ?? "";
  const query = searchParams.get("q") ?? "";
  const terms = searchTerms(query);
  // 標題、內文、關鍵字都算：想得起來的可能是任何一個，內文更是常常只記得半句
  const journal = allJournal.filter(
    (e) =>
      (!kind || e.kind === kind) &&
      matchesSearch(terms, e.title, e.note, e.keywords, e.kind, e.sourceTitle),
  );

  const action = (
    <div className="flex min-w-0 items-center gap-2">
      <SearchButton value={query} onChange={(next) => setParams({ q: next || null })} />
      <JournalFilter
        groups={[{ key: "kind", label: "類型", options: usedKinds(allJournal), value: kind }]}
        onChange={(key, next) => setParams({ [key]: next || null })}
      />
      <ActionButton href="/journal/new">新增</ActionButton>
    </div>
  );
  if (!mounted) return null;

  if (isLoading || error || journal.length === 0) {
    return (
      <>
        <PageHeader title="書寫" action={action} />
        <PageMessage tone={error ? "error" : "muted"}>
          {isLoading ? "載入中…" : error || "符合條件的書寫是空的"}
        </PageMessage>
      </>
    );
  }

  return (
    <>
      <PageHeader title="書寫" action={action} />
      <PageBody>
        {/* 沒寫心得的也要看得到：這裡是紀事本身的清單 */}
        <ReflectionTimeline reflections={journalToReflections(journal, false)} />
      </PageBody>
    </>
  );
}

/** 底下讀網址參數的元件要有 Suspense 邊界，靜態預先產生才不會失敗 */
export default function JournalPage() {
  return (
    <Suspense fallback={null}>
      <JournalList />
    </Suspense>
  );
}
