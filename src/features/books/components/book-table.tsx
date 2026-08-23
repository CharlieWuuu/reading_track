"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { Tag } from "lucide-react";
import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { BookCover } from "@/components/ui/book-cover";
import { STATUS_STYLES, StatusBadge, TagList } from "@/components/ui/tag-badge";
import { bookHref } from "@/config/routes";
import { useBooks } from "@/hooks/use-books";
import { useMounted } from "@/hooks/use-mounted";
import { useUrlParams } from "@/hooks/use-url-param";
import { isBookViewMode, useBookViewStore } from "@/stores/use-book-view-store";
import { useSheetStore } from "@/stores/use-sheet-store";
import { TOKENS } from "@/styles/generated/tokens";
import { Book, ReadingStatus, splitLines } from "@/types/book";
import { effectiveStatus, matchesStatus, parseStatusFilter } from "@/utils/book-filter";
import { matchesSearch, searchTerms } from "@/utils/search";

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

/**
 * 每一列的底色：依完成年份交錯，今年白底、去年灰底、前年又回到白底……
 * 灰色沿用日曆「非本月」那格的底色，整個 app 只有一組次要底色。
 */
function rowTone(endDate: string | null, thisYear: number): string {
  const year = endDate ? Number(endDate.slice(0, 4)) : thisYear;
  const distance = Number.isNaN(year) ? 0 : Math.abs(thisYear - year);
  return distance % 2 === 1 ? "bg-gray-100 hover:bg-gray-200" : "bg-white hover:bg-gray-50";
}

/** 書封牆用的狀態標記：壓在封面左上角的小標籤，白邊讓它在任何封面上都看得見 */
function StatusDot({ status }: { status: ReadingStatus }) {
  if (status === "已讀完") return null;
  return (
    <span
      className={`rounded-control absolute top-1 left-1 px-1 py-px text-[10px] leading-4 ring-2 ring-white ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

/**
 * 還沒讀完的書在最左邊加一條色帶。
 *
 * 鋪滿整列的底色太髒，而且會跟年度交錯打架；細色條面積小、不干擾內容，
 * 但垂直掃一眼就看得到「未讀區」的邊界到哪裡。
 */
/**
 * 表格用的色條顏色：畫成絕對定位的一條，不佔版面寬度。
 * 用該狀態徽章的底色，色條與徽章才是同一件事的兩種畫法。
 */
function accentColor(status: ReadingStatus): string | null {
  if (status === "想讀") return TOKENS["status-want-bg"];
  if (status === "閱讀中") return TOKENS["status-reading-bg"];
  return null;
}

function statusAccent(status: ReadingStatus): string {
  if (status === "想讀") return "border-l-[3px] border-l-status-want-bg";
  if (status === "閱讀中") return "border-l-[3px] border-l-status-reading-bg";
  return "border-l-[3px] border-l-transparent";
}

/**
 * 只有「已讀完」的書有編號：編號代表「讀完的第幾本」，想讀與閱讀中還沒讀完，
 * 給了號碼反而看不出順序。清單本來就已排序，這裡照順序由大到小配號。
 */
function completionNumbers(books: Book[]): Map<string, number> {
  const done = books.filter((b) => b.status === "已讀完");
  const numbers = new Map<string, number>();
  done.forEach((b, i) => numbers.set(b.id, done.length - i));
  return numbers;
}

export function BookTable() {
  const router = useRouter();
  const { sheetId } = useSheetStore();
  const mounted = useMounted();
  const { books: allBooks, isLoading, error } = useBooks();
  const numbers = useMemo(() => completionNumbers(allBooks), [allBooks]);
  const thisYear = new Date().getFullYear();
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
  const books = allBooks.filter(
    (b) =>
      matchesStatus(b, status) &&
      (!keyword || splitLines(b.keywords).includes(keyword)) &&
      matchesSearch(terms, b.title, b.author, b.publisher, b.keywords, b.note),
  );
  const clearKeyword = () => setParams({ keyword: null });
  // 帶著目前的檢視進詳細頁，一路傳到編輯頁，存檔後才回得到同一個畫面
  const query = searchParams.toString();
  const detailHref = (id: string) => bookHref(id, query || undefined);

  // 還沒掛載完就什麼都別說，免得閃一下「請先連接」
  if (!mounted) return null;

  if (!sheetId) {
    return <PageMessage>請先到「設定」頁面連接 Google Sheet</PageMessage>;
  }

  if (isLoading) {
    return <PageLoading />;
  }

  if (error) {
    return <PageMessage tone="error">{error}</PageMessage>;
  }

  if (books.length === 0) {
    return (
      <div className="flex w-full flex-col gap-3">
        {keyword && <KeywordFilter keyword={keyword} count={0} onClear={clearKeyword} />}
        <PageMessage>
          {terms.length > 0
            ? "沒有符合的書"
            : keyword
              ? "沒有書提到這個關鍵字"
              : "尚未新增任何書籍"}
        </PageMessage>
      </div>
    );
  }

  if (view === "card") {
    return (
      <div>
        {/* 書封牆：一次看到很多本、也看得清楚封面，不加外框讓封面自己說話 */}
        <div>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] md:grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))]">
            {books.map((b, i) => (
              <li
                key={b.id || `cover-${i}`}

                className={`p-1.5 ${rowTone(b.endDate, thisYear)}`}
              >
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
                  <p className="truncate text-xs leading-snug font-medium">{b.title}</p>
                  <p className="truncate text-[10px] text-gray-400">
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
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {keyword && <KeywordFilter keyword={keyword} count={books.length} onClear={clearKeyword} />}

      {/* 手機版：卡片列表，欄位太多的表格在小螢幕上不好讀 */}
      <div className="rounded-surface shrink-0 overflow-hidden border bg-white md:hidden">
        <ul className="divide-y">
          {books.map((b, i) => (
            <li key={b.id || `card-${i}`}>
              <Link
                href={detailHref(b.id)}
                className={`flex items-center gap-3 p-3 ${rowTone(b.endDate, thisYear)} ${statusAccent(b.status)}`}
              >
                <BookCover url={b.coverUrl} title={b.title} size="xl" />
                {/* 手機一列固定兩行：第一行是書名與狀態，第二行擠進作者、標籤與日期 */}
                <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
                  <p className="flex min-w-0 items-center gap-2 text-sm font-medium">
                    {numbers.has(b.id) && (
                      <span className="shrink-0 text-xs text-gray-400 tabular-nums">
                        #{numbers.get(b.id)}
                      </span>
                    )}
                    <span className="min-w-0 flex-1 truncate">{b.title}</span>
                    <StatusBadge status={b.status} />
                  </p>
                  {/* 長度無上限的欄位（關鍵字、文章、心得）永遠不進這行，列高才不會跟著資料跳 */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    {/* 作者與標籤共用剩下的寬度，塞不下就讓外層裁掉，日期永遠留在最右邊 */}
                    <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
                      {/* 作者至少留五個字寬，太窄就認不出是誰 */}
                      <span className="max-w-[45%] min-w-[5em] shrink-0 truncate text-gray-500">
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
            </li>
          ))}
        </ul>
      </div>

      {/* 外框負責圓角與邊框，捲動只發生在裡面：表頭 sticky 住，只有列在動 */}
      <div className="rounded-surface hidden min-h-0 w-full flex-1 overflow-y-auto border bg-white md:block">
        <table className="w-full table-fixed text-sm">
          {/* sticky 的儲存格自己畫底色與下緣線，邊框不會跟著黏住 */}
          <thead className="bg-table-header-bg sticky top-0 z-10 text-left [&_th]:shadow-[inset_0_-1px_0_var(--color-table-header-rule)]">
            {/* 欄寬用百分比，次要欄位隨螢幕變窄逐一收起，才不會撐出橫向捲軸 */}
            <tr>
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
                className={`cursor-pointer border-t ${rowTone(b.endDate, thisYear)}`}
              >
                {/*
                狀態色條疊在第一格上，不用 border-l——那會把整個 tbody 往右推 3px，
                表頭得跟著補一條透明的才對得齊，是很容易再壞掉的做法。
              */}
                <td className="relative px-3 py-2">
                  {accentColor(b.status) && (
                    <span
                      className="absolute inset-y-0 left-0 w-[3px]"
                      style={{ background: accentColor(b.status) ?? undefined }}
                    />
                  )}
                  <BookCover url={b.coverUrl} title={b.title} size="md" />
                </td>
                <td className="max-w-0 overflow-hidden px-3 py-2 align-middle">
                  {/* 編號與書名是同一塊，一起垂直置中；沒有編號時那一行就不存在 */}
                  <div className="flex flex-col justify-center">
                    {numbers.has(b.id) && (
                      <span className="text-[11px] leading-4 text-gray-400 tabular-nums">
                        #{numbers.get(b.id)}
                      </span>
                    )}
                    {/* 書名至少要跟其他欄位一樣大（表格是 text-sm），再小就變成次要資訊了 */}
                    <span className="overflow-hidden text-sm font-medium text-ellipsis whitespace-nowrap">
                      {b.title}
                    </span>
                  </div>
                </td>
                <td className="max-w-0 overflow-hidden px-3 py-2 whitespace-nowrap">
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
                <td className="hidden max-w-0 overflow-hidden px-3 py-2 whitespace-nowrap xl:table-cell">
                  <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                    {b.startDate ?? "—"}
                  </span>
                </td>
                <td className="hidden max-w-0 overflow-hidden px-3 py-2 whitespace-nowrap lg:table-cell">
                  <span className="block overflow-hidden text-ellipsis whitespace-nowrap">
                    {b.endDate ?? "—"}
                  </span>
                </td>
                <td className="hidden max-w-0 overflow-hidden px-3 py-2 lg:table-cell">
                  <TagList values={[b.domain]} tone="domain" wrap={false} />
                </td>
                <td className="hidden max-w-0 overflow-hidden px-3 py-2 xl:table-cell">
                  <TagList values={[b.type]} tone="type" wrap={false} />
                </td>
                <td className="hidden max-w-0 overflow-hidden px-3 py-2 whitespace-nowrap 2xl:table-cell">
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
