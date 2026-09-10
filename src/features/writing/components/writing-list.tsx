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
import { writingItem } from "@/utils/overview-items";
import { matchesSearch, searchTerms } from "@/utils/search";

/** 書寫清單。搜尋、篩選、看哪一種都在網址上，所以這裡自己讀。 */
export function WritingList() {
  const mounted = useMounted();
  const { writings: allWriting, isLoading, error, mutate } = useWritings();
  const { searchParams } = useUrlParams();

  const topic = searchParams.get("topic") ?? "";
  const view = WRITING_VIEWS.parse(searchParams.get("view"));
  const terms = searchTerms(searchParams.get("q") ?? "");
  // 標題、內文、關鍵字都算：想得起來的可能是任何一個，內文更是常常只記得半句
  const writings = allWriting.filter(
    (e) =>
      (!topic || e.topic === topic) &&
      matchesSearch(terms, e.title, e.note, e.keywords, e.kind, e.sourceTitle),
  );

  if (!mounted) return null;
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
