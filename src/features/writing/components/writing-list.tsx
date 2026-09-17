"use client";

import { PageBody } from "@/components/layout/page-body";
import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { GroupOverview } from "@/components/ui/group-overview/group-overview";
import { OverviewRailList } from "@/components/ui/overview-layout/overview-rail-stats";
import { WritingTable } from "@/features/writing/components/writing-table";
import {
  WRITING_THREAD_GRID,
  WritingThreadRow,
} from "@/features/writing/components/writing-thread-row";
import { useWritingView } from "@/features/writing/use-writing-view";
import { useMounted } from "@/hooks/use-mounted";
import { useUrlParams } from "@/hooks/use-url-param";
import { useWritings } from "@/hooks/use-writings";
import { useWritingsOverview } from "@/hooks/use-writings-overview";
import { splitLines } from "@/types/book";
import { Writing } from "@/types/writing";
import { OverviewItem, tally } from "@/utils/overview";
import { writingItem } from "@/utils/overview-items";
import { matchesSearch, searchTerms } from "@/utils/search";

const RAIL_LIST_SIZE = 5;

/**
 * 概覽中間那格畫成 threads 那種一路往下讀的流。
 *
 * OverviewItem 只帶得動標題與一行小字，這裡要整段內文與關鍵字，
 * 所以照 id 把原始那一筆找回來——關鍵字卡片牆也是同一個做法。
 */
const writingsById = (writings: readonly Writing[]) => new Map(writings.map((w) => [w.id, w]));

function threadItem(byId: Map<string, Writing>, item: OverviewItem) {
  const writing = byId.get(item.id);
  if (!writing) return null;
  return <WritingThreadRow writing={writing} href={item.href} />;
}

/** 右欄補的排行：主題、關鍵字——書寫沒有進行中／想要可以列 */
function WritingRail({ writings }: { writings: readonly Writing[] }) {
  const topics = tally(
    writings.map((w) => w.topic),
    "則",
    RAIL_LIST_SIZE,
  );
  const keywords = tally(
    writings.flatMap((w) => splitLines(w.keywords)),
    "則",
    RAIL_LIST_SIZE,
  );

  return (
    <>
      <OverviewRailList label="主題排行" count={topics.length} items={topics} />
      <OverviewRailList label="常出現的關鍵字" count={keywords.length} items={keywords} />
    </>
  );
}

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
  const view = useWritingView();
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
      matchesSearch(terms, e.title, e.note, e.keywords, e.sourceTitle),
  );

  if (isLoading) return <PageLoading />;
  if (error)
    return (
      <PageMessage tone="error" fill>
        {error}
      </PageMessage>
    );
  if (writings.length === 0) return <PageMessage fill>符合條件的書寫是空的</PageMessage>;

  const byId = writingsById(writings);

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
          renderItem={(item) => threadItem(byId, item)}
          gridClassName={WRITING_THREAD_GRID}
          extraRail={<WritingRail writings={writings} />}
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

  const byId = writingsById(overview.writings);

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
        renderItem={(item) => threadItem(byId, item)}
        gridClassName={WRITING_THREAD_GRID}
        extraRail={<WritingRail writings={overview.writings} />}
      />
    </PageBody>
  );
}
