"use client";

import { PageBody } from "@/components/layout/page-body";
import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { WritingTable } from "@/features/writing/components/writing-table";
import { WRITING_VIEWS } from "@/features/writing/views";
import { useMounted } from "@/hooks/use-mounted";
import { useUrlParams } from "@/hooks/use-url-param";
import { useWritings } from "@/hooks/use-writings";
import { Writing } from "@/types/writing";
import { matchesSearch, searchTerms } from "@/utils/search";

/**
 * 書寫清單。搜尋、篩選、看哪一種都在網址上，所以這裡自己讀。
 *
 * 時間軸那一版由 app 那層傳進來：它住在 features/notes，而 features 之間
 * 不互相 import（eslint 的 import/no-restricted-paths 會擋）。理由同 Sidebar 的 authSlot。
 */
export function WritingList({ timeline }: { timeline: (writings: Writing[]) => React.ReactNode }) {
  const mounted = useMounted();
  const { writings: allWriting, isLoading, error } = useWritings();
  const { searchParams } = useUrlParams();

  const kind = searchParams.get("kind") ?? "";
  const view = WRITING_VIEWS.parse(searchParams.get("view"));
  const terms = searchTerms(searchParams.get("q") ?? "");
  // 標題、內文、關鍵字都算：想得起來的可能是任何一個，內文更是常常只記得半句
  const writings = allWriting.filter(
    (e) =>
      (!kind || e.kind === kind) &&
      matchesSearch(terms, e.title, e.note, e.keywords, e.kind, e.sourceTitle),
  );

  if (!mounted) return null;
  if (isLoading) return <PageLoading />;
  if (error) return <PageMessage tone="error">{error}</PageMessage>;
  if (writings.length === 0) return <PageMessage>符合條件的書寫是空的</PageMessage>;

  return (
    <PageBody>
      {/* 沒寫心得的也要看得到：這裡是紀事本身的清單 */}
      {view === "table" ? <WritingTable writings={writings} /> : timeline(writings)}
    </PageBody>
  );
}
