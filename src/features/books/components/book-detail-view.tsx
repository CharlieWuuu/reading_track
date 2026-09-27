"use client";

import { PageBody, PageMain } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { BookCover } from "@/components/ui/book-cover";
import { ActionButton } from "@/components/ui/controls";
import {
  DetailField,
  DetailHeader,
  DetailHeading,
  DetailTitle,
  KindFacts,
} from "@/components/ui/detail";
import { KeywordTag } from "@/components/ui/keyword-tag";
import { KindSectionBlock } from "@/components/ui/kind-section/kind-section";
import { NoteBlock } from "@/components/ui/note-block";
import { StatusBadge } from "@/components/ui/tag-badge";
import { kindHref } from "@/config/kind-routes";
import { bookEditHref } from "@/config/routes";
import { useBooks } from "@/hooks/use-books";
import { useCatalogRecord } from "@/hooks/use-catalog-record";
import { useGroupFragments } from "@/hooks/use-group-fragments";
import { useKinds } from "@/hooks/use-kinds";
import { useUrlParams } from "@/hooks/use-url-param";
import { Kind } from "@/lib/db/queries/kinds";
import { Book, formatCount, splitLines } from "@/types/book";
import { sameBook } from "@/utils/book-reads";
import { factFields, longFields } from "@/utils/detail-fields";
import { KindSection, linkedTo, sectionsByKind } from "@/utils/overview-sections";

/** 一次讀完就知道的四個數字：書裡留下了多少東西，緊接在量化資訊行下面 */
/** 書名頁底下那排數字：這本書長出了幾則什麼，一種類型一格，不寫死佳句單字 */
function CountStats({ items }: { items: { label: string; value: number }[] }) {
  if (items.length === 0) return null;
  return (
    <div className="border-rule-soft mt-1.5 flex flex-wrap gap-8 border-t pt-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="font-serif text-2xl font-semibold text-gray-900">{item.value}</div>
          <span className="text-label text-ink-faint uppercase">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
// 右欄的資料卡：狀態是推論出來的徽章自己畫，其餘照類型勾的欄位列，空的也列
function BookFacts({
  book,
  kind,
  values,
}: {
  book: Book;
  kind?: Kind;
  values: Record<string, string>;
}) {
  return (
    <>
      <DetailField label="狀態" align="right">
        <StatusBadge status={book.status} />
      </DetailField>
      {kind && (
        <KindFacts
          entries={factFields(kind, values, SHOWN_IN_HEADER)}
          sourceUrl={values.externalUrl}
        />
      )}
    </>
  );
}

// 書名頁與量化資訊行畫過的（有值才算）不重複列
const SHOWN_IN_HEADER = new Set(["creator", "domain", "subDomain", "amount", "platform"]);

/** 片段只露幾則，其餘去那個類型頁看 */
const FRAGMENT_PREVIEW = 3;

export function BookDetailView({ recordId }: { recordId: string }) {
  const id = recordId;
  const { books, isLoading, error } = useBooks();
  const fragments = useGroupFragments("fragments");
  const writings = useGroupFragments("writings");
  const { kinds } = useKinds();
  // 欄位照類型勾的列，值讀通用的那一份——舊的 Book 形狀沒有摘要這些
  const { record } = useCatalogRecord(id);
  const kind = kinds.find((k) => k.id === record?.kindId);
  const values = record?.values ?? {};
  // 從書單帶進來的檢視方式與頁碼，一路傳給編輯頁，存完才回得到同一個畫面
  const { searchParams } = useUrlParams();
  const back = searchParams.get("back");
  const booksListHref = kindHref("records", "books");
  const backHref = back ? `${booksListHref}?${back}` : booksListHref;
  const book = books.find((b) => b.id === id);

  if (isLoading || error || !book) {
    return (
      <>
        <PageHeader title="書籍資訊" size="compact" backHref={backHref} />
        {/* 訊息也走 PageBody：不然它只是頁首下面一個小方塊，跟載入中的位置對不齊 */}
        <PageBody>
          <PageMain>
            {isLoading ? (
              <PageLoading />
            ) : (
              <PageMessage tone={error ? "error" : "muted"} fill>
                {error || "找不到這本書"}
              </PageMessage>
            )}
          </PageMain>
        </PageBody>
      </>
    );
  }

  const keywords = splitLines(book.keywords);
  // 佳句與單字綁的是「某一次讀」那一列，所以重讀的那幾列要一起算進來
  const reads = sameBook(books, book);
  // 片段掛在作品上，書寫掛在某一次讀那一列上——兩種編號都收
  const ids = new Set([book.workId, ...reads.map((b) => b.id)]);
  const fragmentSections = sectionsByKind(linkedTo(fragments.fragments, ids), {
    take: FRAGMENT_PREVIEW,
  });
  // 書寫是主內容，整則都列，不截
  const writingSections = sectionsByKind(linkedTo(writings.fragments, ids), { take: Infinity });
  const longs = kind ? longFields(kind, values) : [];
  const counts = [...writingSections, ...fragmentSections]
    .map((section: KindSection) => ({ label: section.name, value: section.total }))
    .concat(keywords.length > 0 ? [{ label: "關鍵字", value: keywords.length }] : []);

  // 量化資訊行：領域、子領域、頁數、平台，缺的項目自動不留空隙
  const quantLine = [
    book.domain,
    book.subDomain,
    formatCount(book.pageCount) && `${formatCount(book.pageCount)} 頁`,
    book.platform,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <PageHeader
        title="詳情"
        parent={[
          { label: "紀錄", href: "/records" },
          { label: "書籍", href: booksListHref },
        ]}
        backHref={backHref}
        action={<ActionButton href={bookEditHref(book.id, back)}>編輯</ActionButton>}
      />

      <PageBody>
        <PageMain>
          <article className="flex w-full flex-col gap-8">
            {/* 書名頁：封面＋書名／作者／量化資訊／統計數字在左，固定資料卡在右 */}
            <DetailHeader facts={<BookFacts book={book} kind={kind} values={values} />}>
              <BookCover
                url={book.coverUrl}
                title={book.title}
                size="detail"
                className="shrink-0 self-start"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                <DetailTitle title={book.title} subtitle={book.author} />
                {quantLine && <p className="text-meta text-ink-faint">{quantLine}</p>}
                <CountStats items={counts} />
              </div>
            </DetailHeader>

            {/* 主內容雙欄：左邊書寫（含關鍵字），右邊片段，都照類型分區 */}
            <div className="flex flex-col gap-8 md:flex-row">
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                {/* 這本書自己的長文（摘要），跟連過來的書寫是兩回事，各自一區 */}
                {longs.map((field) => (
                  <div key={field.key} className="flex flex-col gap-3">
                    <DetailHeading title={field.label} />
                    <NoteBlock note={field.value} />
                  </div>
                ))}

                {/* 一種類型一區，照各自的卡片樣式：思緒掛在寫著「心得」的標題底下對不起來 */}
                {writingSections.map((section) => (
                  <KindSectionBlock key={section.slug} group="writings" section={section} />
                ))}

                {keywords.length > 0 && (
                  <div className="flex flex-col gap-2 pt-2">
                    <span className="text-label text-ink-faint uppercase">關鍵字</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {keywords.map((keyword) => (
                        <KeywordTag
                          key={keyword}
                          name={keyword}
                          className="rounded-control bg-gray-100 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-200"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {fragmentSections.length > 0 && (
                <>
                  {/* 分隔線是獨立元素，兩側都靠父層的 gap */}
                  <div className="bg-rule hidden w-px shrink-0 md:block" />
                  <div className="flex w-full flex-col gap-8 md:w-73 md:shrink-0">
                    {fragmentSections.map((section) => (
                      <KindSectionBlock
                        key={section.slug}
                        group="fragments"
                        section={section}
                        stacked
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </article>
        </PageMain>
      </PageBody>
    </>
  );
}
