"use client";

import { PageBody } from "@/components/layout/page-body";
import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { GroupOverview } from "@/components/ui/group-overview/group-overview";
import { WritingTable } from "@/features/writing/components/writing-table";
import { WRITING_VIEWS } from "@/features/writing/views";
import { useMounted } from "@/hooks/use-mounted";
import { useUrlParams } from "@/hooks/use-url-param";
import { useWritings } from "@/hooks/use-writings";
import { useWritingsOverview } from "@/hooks/use-writings-overview";
import { writingItem } from "@/utils/overview-items";
import { matchesSearch, searchTerms } from "@/utils/search";

/**
 * 書寫清單。搜尋、篩選、看哪一種都在網址上，所以這裡自己讀。
 *
 * 有 topic／q 篩選時要整包資料在前端 filter，套不了分頁，退回整包抓取；
 * 沒有篩選條件的概覽模式才用分頁。table 檢視永遠要整包（排序、篩選都在前端做）。
 */
export function WritingList() {
  const mounted = useMounted();
  const { searchParams } = useUrlParams();

  const topic = searchParams.get("topic") ?? "";
  const view = WRITING_VIEWS.parse(searchParams.get("view"));
  const q = searchParams.get("q") ?? "";
  const filtered = Boolean(topic || q);

  if (!mounted) return null;
  if (view === "table" || filtered) return <WritingListFull view={view} topic={topic} q={q} />;
  return <WritingListPaged />;
}

function WritingListFull({ view, topic, q }: { view: string; topic: string; q: string }) {
  const { writings: allWriting, isLoading, error, mutate } = useWritings();
  const terms = searchTerms(q);
  // 標題、內文、關鍵字都算：想得起來的可能是任何一個，內文更是常常只記得半句
  const writings = allWriting.filter(
    (e) =>
      (!topic || e.topic === topic) &&
      matchesSearch(terms, e.title, e.note, e.keywords, e.kind, e.sourceTitle),
  );

  if (isLoading) return <PageLoading />;
  if (error)
    return (
      <PageMessage tone="error" fill>
        {error}
      </PageMessage>
    );
  if (writings.length === 0) return <PageMessage fill>符合條件的書寫是空的</PageMessage>;

  return (
    <PageBody>
      {view === "table" ? (
        <WritingTable writings={writings} onSaved={mutate} />
      ) : (
        <GroupOverview
          active={[]}
          pending={[]}
          done={writings.map(writingItem)}
          headlineLabel="最新一則"
          unit="則"
        />
      )}
    </PageBody>
  );
}

function WritingListPaged() {
  const overview = useWritingsOverview();

  if (overview.isLoading) return <PageLoading />;
  if (overview.error)
    return (
      <PageMessage tone="error" fill>
        {overview.error}
      </PageMessage>
    );
  if (overview.writings.length === 0) return <PageMessage fill>符合條件的書寫是空的</PageMessage>;

  return (
    <PageBody>
      <GroupOverview
        active={[]}
        pending={[]}
        done={overview.writings.map(writingItem)}
        doneTotal={overview.total}
        headlineLabel="最新一則"
        unit="則"
        onLoadMore={overview.loadMore}
        hasMore={overview.hasMore}
        isLoadingMore={overview.isLoadingMore}
      />
    </PageBody>
  );
}
