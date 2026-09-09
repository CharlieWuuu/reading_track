"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Tag } from "lucide-react";
import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { BookCover } from "@/components/ui/book-cover";
import { ListHeading } from "@/components/ui/list-heading";
import { STATUS_DOTS, StatusBadge, TagList } from "@/components/ui/tag-badge";
import { bookHref } from "@/config/routes";
import { useBooks } from "@/hooks/use-books";
import { useMounted } from "@/hooks/use-mounted";
import { useRecords } from "@/hooks/use-records";
import { useUrlParams } from "@/hooks/use-url-param";
import { useWritings } from "@/hooks/use-writings";
import { isBookViewMode, useBookViewStore } from "@/stores/use-book-view-store";
import { Book, RecordStatus, splitLines } from "@/types/book";
import {
  effectiveStatus,
  matchesStatus,
  parseStatusFilter,
  statusHeading,
} from "@/utils/book-filter";
import { matchesSearch, searchTerms } from "@/utils/search";
import { BookOverview } from "./book-overview";

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
  const router = useRouter();
  const mounted = useMounted();
  const { books: allBooks, isLoading, error } = useBooks();
  const { writings } = useWritings();
  const { quotes, vocabulary } = useRecords();
  const numbers = useMemo(() => completionNumbers(allBooks), [allBooks]);
  const { searchParams, setParams } = useUrlParams();
  const { view: savedView } = useBookViewStore();
  // 檢視方式以網址為準，重新整理或分享連結才回得到同一個畫面
  const urlView = searchParams.get("view");
  const view = isBookViewMode(urlView) ? urlView : savedView;
  // 反查：帶著 ?keyword= 就只看提到這個關鍵字的書
  const keyword = searchParams.get("keyword") ?? "";
  // 搜尋框在頁首，這裡跟著網址走：關鍵字反查與搜尋兩個條件同時成立
  const terms = searchTerms(searchParams.get("q") ?? "");
  // 找東西的時候不篩狀態：搜書名找不到會讓人以為那本書不見了
  const status = effectiveStatus(
    parseStatusFilter(searchParams.get("status")),
    terms.length > 0 || Boolean(keyword),
  );
  // 概覽自己會把在讀、想讀、讀完排在同一頁，所以狀態篩選只套在其餘檢視上
  const found = allBooks.filter(
    (b) =>
      (!keyword || splitLines(b.keywords).includes(keyword)) &&
      matchesSearch(terms, b.title, b.author, b.publisher, b.keywords, b.note),
  );
  const books = found.filter((b) => matchesStatus(b, status));
  const clearKeyword = () => setParams({ keyword: null });
  // 搜尋與關鍵字反查會蓋掉狀態篩選，所以標題要照真正生效的條件寫
  const heading =
    terms.length > 0 ? "搜尋結果" : keyword ? `提到「${keyword}」` : statusHeading(status);
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
      <div className="flex flex-col gap-2">
        <ListHeading label={heading} count={books.length} />
        {/* 書封牆：一次看到很多本、也看得清楚封面，不加外框讓封面自己說話 */}
        <div>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] md:grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))]">
            {books.map((b, i) => (
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
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <ListHeading label={heading} count={books.length} />
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
      <div className="hidden w-full md:block">
        <table className="w-full table-fixed">
          {/* sticky 的表頭跟著概覽頁的細線風格，不用底色塊 */}
          <thead className="border-rule-strong bg-background sticky top-0 z-10 border-b text-left">
            {/* 欄寬用百分比，次要欄位隨螢幕變窄逐一收起，才不會撐出橫向捲軸 */}
            <tr className="text-label text-ink-faint tracking-label [&_th]:font-normal">
              <th className="w-[6%] px-3 py-2 whitespace-nowrap">封面</th>
              {/* 書名字級縮小後空間變多，日期與分類可以提早出現 */}
              <th className="w-[26%] px-3 py-2 whitespace-nowrap">書名</th>
              <th className="w-[13%] px-3 py-2 whitespace-nowrap">作者</th>
              <th className="w-[9%] px-3 py-2 whitespace-nowrap">狀態</th>
              <th className="hidden w-[10%] px-3 py-2 whitespace-nowrap lg:table-cell">平台</th>
              <th className="hidden w-[10%] px-3 py-2 whitespace-nowrap xl:table-cell">開始日期</th>
              <th className="hidden w-[10%] px-3 py-2 whitespace-nowrap lg:table-cell">完成日期</th>
              <th className="hidden w-[10%] px-3 py-2 whitespace-nowrap lg:table-cell">領域</th>
              <th className="hidden w-[10%] px-3 py-2 whitespace-nowrap xl:table-cell">屬性</th>
              <th className="hidden w-[6%] px-3 py-2 whitespace-nowrap 2xl:table-cell">語言</th>
            </tr>
          </thead>
          <tbody>
            {books.map((b, i) => (
              // 整列點擊就進編輯頁，所以書名不再另外做成連結樣式
              <tr
                key={b.id || `row-${i}`}
                onClick={() => router.push(detailHref(b.id))}
                className="border-rule hover:bg-control-bg-hover/5 cursor-pointer border-t first:border-t-0"
              >
                <td className="px-3 py-2">
                  <BookCover url={b.coverUrl} title={b.title} size="md" />
                </td>
                <td className="max-w-0 overflow-hidden px-3 py-2 align-middle">
                  {/* 編號與書名是同一塊，一起垂直置中；沒有編號時那一行就不存在 */}
                  <div className="flex flex-col justify-center">
                    {numbers.has(b.id) && (
                      <span className="text-meta text-ink-faint tabular-nums">
                        #{numbers.get(b.id)}
                      </span>
                    )}
                    {/* 書名用 serif，跟概覽頁的條目標題同一套 */}
                    <span className="text-item-sm overflow-hidden font-serif font-semibold tracking-tight text-ellipsis whitespace-nowrap">
                      {b.title}
                    </span>
                  </div>
                </td>
                <td className="text-byline text-ink-muted max-w-0 overflow-hidden px-3 py-2 whitespace-nowrap">
                  <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                    {b.author}
                  </span>
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <StatusBadge status={b.status} />
                </td>
                {/* max-w-0 + overflow-hidden：table-fixed 下標籤太寬會擠進隔壁欄，寧可切掉 */}
                <td className="hidden max-w-0 overflow-hidden px-3 py-2 lg:table-cell">
                  <TagList values={[b.platform]} tone="platform" wrap={false} />
                </td>
                <td className="text-meta text-ink-faint hidden max-w-0 overflow-hidden px-3 py-2 whitespace-nowrap xl:table-cell">
                  <span className="block overflow-hidden text-ellipsis whitespace-nowrap tabular-nums">
                    {b.startDate ?? "—"}
                  </span>
                </td>
                <td className="text-meta text-ink-faint hidden max-w-0 overflow-hidden px-3 py-2 whitespace-nowrap lg:table-cell">
                  <span className="block overflow-hidden text-ellipsis whitespace-nowrap tabular-nums">
                    {b.endDate ?? "—"}
                  </span>
                </td>
                <td className="hidden max-w-0 overflow-hidden px-3 py-2 lg:table-cell">
                  <TagList values={[b.domain]} tone="domain" wrap={false} />
                </td>
                <td className="hidden max-w-0 overflow-hidden px-3 py-2 xl:table-cell">
                  <TagList values={[b.type]} tone="type" wrap={false} />
                </td>
                <td className="text-byline text-ink-muted hidden max-w-0 overflow-hidden px-3 py-2 whitespace-nowrap 2xl:table-cell">
                  <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                    {b.language}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 翻頁列放在框外，跟詳細檢視一致 */}
    </div>
  );
}
