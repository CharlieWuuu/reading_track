"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Tag } from "lucide-react";
import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { BookCover } from "@/components/ui/book-cover";
import { ListHeading } from "@/components/ui/list-heading";
import { STATUS_DOTS, StatusBadge, TagList } from "@/components/ui/tag-badge";
import { bookHref } from "@/config/routes";
import { useBookView } from "@/hooks/use-book-view";
import { useBooks } from "@/hooks/use-books";
import { useFilteredBooks } from "@/hooks/use-filtered-books";
import { useMounted } from "@/hooks/use-mounted";
import { useRecords } from "@/hooks/use-records";
import { useUrlParams } from "@/hooks/use-url-param";
import { useWritings } from "@/hooks/use-writings";
import { Book, RecordStatus } from "@/types/book";
import { byYear } from "@/utils/book-overview";
import { BookOverview } from "./book-overview";
import { BookTableGrid } from "./book-table-grid";

/** 目前篩選中的關鍵字。放在清單上方，因為它會改變下面看到的是什麼 */
function KeywordFilter({
  keyword,
  count,
  onClear,
}: {
  keyword: string;
  count: number;
  onClear: () => void;
}) {
  return (
    <div className="rounded-surface flex shrink-0 flex-wrap items-center gap-2 border bg-white px-3 py-2 text-sm">
      <Tag size={14} strokeWidth={1.5} className="shrink-0 text-gray-400" />
      <span className="font-medium">{keyword}</span>
      <span className="text-xs text-gray-400">{count} 本</span>
      <button
        type="button"
        onClick={onClear}
        className="rounded-control ml-auto px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100"
      >
        清除
      </button>
    </div>
  );
}

/** 書封牆用的狀態標記：壓在封面左上角的一顆點，白邊讓它在任何封面上都看得見 */
function StatusDot({ status }: { status: RecordStatus }) {
  if (status === "完成") return null;
  return (
    <span
      aria-label={status}
      className={`absolute top-1 left-1 size-2 rounded-full ring-2 ring-white ${STATUS_DOTS[status]}`}
    />
  );
}

/**
 * 只有「已讀完」的書有編號：編號代表「讀完的第幾本」，想讀與閱讀中還沒讀完，
 * 給了號碼反而看不出順序。清單本來就已排序，這裡照順序由大到小配號。
 */
function completionNumbers(books: Book[]): Map<string, number> {
  const done = books.filter((b) => b.status === "完成");
  const numbers = new Map<string, number>();
  done.forEach((b, i) => numbers.set(b.id, done.length - i));
  return numbers;
}

export function BookTable() {
  const [editAll, setEditAll] = useState(false);
  const mounted = useMounted();
  const { allBooks, isLoading, error, found, books, keyword, terms, heading } = useFilteredBooks();
  const { mutate } = useBooks();
  const { writings } = useWritings();
  const { quotes, vocabulary } = useRecords();
  const numbers = useMemo(() => completionNumbers(allBooks), [allBooks]);
  const { searchParams, setParams } = useUrlParams();
  const view = useBookView();
  const clearKeyword = () => setParams({ keyword: null });
  // 帶著目前的檢視進詳細頁，一路傳到編輯頁，存檔後才回得到同一個畫面
  const query = searchParams.toString();
  const detailHref = (id: string) => bookHref(id, query || undefined);

  if (!mounted) return null;

  if (isLoading) {
    return <PageLoading />;
  }

  if (error) {
    return (
      <PageMessage tone="error" fill>
        {error}
      </PageMessage>
    );
  }

  if (books.length === 0) {
    return (
      <div className="flex w-full flex-col gap-3">
        {/* 0 本也要說出來：沒有標題列的話，看起來像篩選沒生效 */}
        <ListHeading label={heading} count={0} />
        {keyword && <KeywordFilter keyword={keyword} count={0} onClear={clearKeyword} />}
        <PageMessage fill>
          {terms.length > 0
            ? "沒有符合的書"
            : keyword
              ? "沒有書提到這個關鍵字"
              : "尚未新增任何書籍"}
        </PageMessage>
      </div>
    );
  }

  if (view === "overview") {
    return (
      <BookOverview
        books={found}
        href={(book) => detailHref(book.id)}
        writings={writings}
        quotes={quotes}
        vocabulary={vocabulary}
      />
    );
  }

  if (view === "card") {
    return (
      <div className="flex flex-col gap-4">
        <ListHeading label={heading} count={books.length} />
        {/* 書封牆：一次看到很多本、也看得清楚封面，不加外框讓封面自己說話。
            照完成年份分段，跟概覽頁同一套邏輯，只是粒度粗到年 */}
        {byYear(books).map((group) => (
          <div key={group.label} className="flex flex-col gap-2">
            <div className="border-rule-strong flex items-baseline justify-between border-b pb-1.5">
              <span className="text-item-sm font-serif font-semibold tracking-wide">
                {group.label}
              </span>
              <span className="text-meta text-ink-faint tabular-nums">{group.books.length} 本</span>
            </div>
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] md:grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))]">
              {group.books.map((b, i) => (
                <li key={b.id || `cover-${i}`} className="p-1.5">
                  {/* 書封、書名、日期三層都靠 gap 分開，卡片高度固定不隨書名長短跳動 */}
                  <Link href={detailHref(b.id)} className="group flex flex-col gap-1">
                    {/* 書封牆是一整面圖，左側色條會把版面切得很碎，改成封面角落的小圓點 */}
                    <div className="relative">
                      <BookCover
                        url={b.coverUrl}
                        title={b.title}
                        size="full"
                        className="transition group-hover:shadow-md"
                      />
                      <StatusDot status={b.status} />
                    </div>
                    <p className="text-item-sm truncate font-serif leading-snug font-semibold tracking-tight">
                      {b.title}
                    </p>
                    <p className="text-meta text-ink-faint truncate tabular-nums">
                      {b.endDate ? `${b.endDate} 讀完` : b.status}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <ListHeading label={heading} count={books.length} />
        <button
          type="button"
          onClick={() => setEditAll((prev) => !prev)}
          className={`rounded-control shrink-0 border px-2 py-1 text-xs font-medium ${
            editAll
              ? "border-accent text-accent"
              : "text-ink-muted hover:bg-control-ghost-hover border-transparent"
          }`}
        >
          {editAll ? "完成編輯" : "編輯模式"}
        </button>
      </div>
      {keyword && <KeywordFilter keyword={keyword} count={books.length} onClear={clearKeyword} />}

      {/* 手機版：卡片列表，欄位太多的表格在小螢幕上不好讀 */}
      <div className="border-rule-strong shrink-0 border-t md:hidden">
        {books.map((b, i) => (
          <Link
            key={b.id || `card-${i}`}
            href={detailHref(b.id)}
            className="border-rule flex items-center gap-3 border-b py-3"
          >
            <BookCover url={b.coverUrl} title={b.title} size="xl" />
            {/* 手機一列固定兩行：第一行是書名與狀態，第二行擠進作者、標籤與日期 */}
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
              <p className="flex min-w-0 items-center gap-2">
                {numbers.has(b.id) && (
                  <span className="text-meta text-ink-faint shrink-0 tabular-nums">
                    #{numbers.get(b.id)}
                  </span>
                )}
                <span className="text-item-sm min-w-0 flex-1 truncate font-serif font-semibold tracking-tight">
                  {b.title}
                </span>
                <StatusBadge status={b.status} />
              </p>
              {/* 長度無上限的欄位（關鍵字、文章、心得）永遠不進這行，列高才不會跟著資料跳 */}
              <div className="text-meta text-ink-faint flex items-center gap-1.5">
                {/* 作者與標籤共用剩下的寬度，塞不下就讓外層裁掉，日期永遠留在最右邊 */}
                <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                  {/* 作者至少留五個字寬，太窄就認不出是誰 */}
                  <span className="text-ink-muted max-w-[45%] min-w-[5em] shrink-0 truncate">
                    {b.author}
                  </span>
                  {/* 標籤裝在同一個盒子裡，放不下就從右邊切掉，不會頂到日期 */}
                  <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
                    <TagList values={[b.platform]} tone="platform" size="sm" wrap={false} />
                    <TagList values={[b.domain]} tone="domain" size="sm" wrap={false} />
                    <TagList values={[b.subDomain]} tone="subDomain" size="sm" wrap={false} />
                    <TagList values={[b.type]} tone="type" size="sm" wrap={false} />
                  </div>
                </div>
                {/* 只放完成日期：閱讀中的書還沒有結束時間，顯示「—」正好說明它還沒讀完 */}
                <span className="shrink-0 tabular-nums">{b.endDate || "—"}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* 不自己開捲動容器：捲動一律交給 PageBody，sticky 的表頭改黏在那一層。
          自己捲的話這一頁的「捲到底」會跟其他頁不一樣（底部留白也吃不到） */}
      <BookTableGrid
        books={books}
        numbers={numbers}
        detailHref={detailHref}
        onSaved={mutate}
        editAll={editAll}
      />

      {/* 翻頁列放在框外，跟詳細檢視一致 */}
    </div>
  );
}
