"use client";

import { CategorySelect } from "@/components/ui/category-select";
import { ContentLinkInput } from "@/components/ui/content-link-input";
import { Field } from "@/components/ui/field";
import { PrivateToggle } from "@/components/ui/private-toggle";
import { ReadBookSuggestions } from "@/features/books/components/read-book-suggestions";
import { useContentLinks } from "@/hooks/use-content-links";
import { Book } from "@/types/book";

/** 一頁裡的分組小標：一行小字加一條線，跟詳細頁的章節標題同一個長相 */
function GroupTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="border-rule-strong text-label tracking-label text-ink shrink-0 border-b pb-1.5 font-semibold uppercase">
      {children}
    </h3>
  );
}

/** 短欄位三個一行；手機三欄會擠成一團，兩欄剛好 */
function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-0 shrink-0 grid-cols-2 content-start gap-3 sm:grid-cols-3">
      {children}
    </div>
  );
}

/** 書籍那一頁的欄位。狀態留在表單那邊，這裡只負責排版與把值交出去 */
export function BookFieldsPanel({
  form,
  set,
  titleSuggestions,
  workId,
}: {
  form: Record<string, string>;
  set: (key: string, value: string) => void;
  /** 新增時才給：打書名時跳出讀過的書，重讀不用重查 */
  titleSuggestions?: { books: Book[]; onPick: (book: Book) => void };
  /** 作品的編號；還沒存的書沒有編號，沒有東西可以連 */
  workId: string | null;
}) {
  const { linked, link, unlink } = useContentLinks(workId);

  return (
    <>
      {/* 自己認得的那幾欄先來：書名獨佔一行，其餘兩兩成對 */}
      <div className="grid min-h-0 shrink-0 grid-cols-2 content-start gap-3">
        <div className="relative col-span-2">
          <Field label="書名" value={form.title} onChange={(v) => set("title", v)} />
          {titleSuggestions && (
            <ReadBookSuggestions
              books={titleSuggestions.books}
              query={form.title}
              onPick={titleSuggestions.onPick}
            />
          )}
        </div>

        {/* ISBN 跟著出版社走：它們講的是同一件事，這本書是哪一版。
              三個都是長字串，手機一行一個才讀得完 */}
        <div className="col-span-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="作者" value={form.author} onChange={(v) => set("author", v)} />
          <Field label="出版社" value={form.publisher} onChange={(v) => set("publisher", v)} />
          <Field label="ISBN" value={form.isbn} onChange={(v) => set("isbn", v)} />
        </div>

        {/* 這三個都很短，擠成一行剛好，不用各佔半排；手機收成兩欄 */}
        <div className="col-span-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Field label="頁數" value={form.pageCount} onChange={(v) => set("pageCount", v)} />
          <Field label="字數" value={form.wordCount} onChange={(v) => set("wordCount", v)} />
          <CategorySelect
            label="語言"
            categoryKey="language"
            value={form.language}
            onChange={(v) => set("language", v)}
          />
        </div>

        {/* 兩個網址跟上面那些欄位一樣是抓回來的，不值得自己一個分組 */}
        <Field label="封面網址" value={form.coverUrl} onChange={(v) => set("coverUrl", v)} />
        <Field label="來源網址" value={form.sourceUrl} onChange={(v) => set("sourceUrl", v)} />
      </div>

      {/* 標記不值得自己一頁：它跟上面一樣是填表，只是填的是自己的看法。
            小標跟它管的欄位包在一起，DOM 上就看得出是同一組 */}
      <div className="flex min-h-0 shrink-0 flex-col gap-3">
        <GroupTitle>標記</GroupTitle>

        {/* 三個一行：兩排欄位，最後一排是私人 */}
        <Section>
          <Field
            label="開始日期"
            type="date"
            value={form.startDate}
            onChange={(v) => set("startDate", v)}
          />
          <Field
            label="完成日期"
            type="date"
            value={form.endDate}
            onChange={(v) => set("endDate", v)}
          />

          {/* 平台是「我在哪讀的」，跟書本身無關，所以跟其他自訂分類放一起 */}
          <CategorySelect
            label="平台"
            categoryKey="platform"
            value={form.platform}
            onChange={(v) => set("platform", v)}
          />

          {/* 領域改成單選：它問的是「為什麼讀這本書」，一本書只會有一個答案 */}
          <CategorySelect
            label="領域"
            categoryKey="domain"
            value={form.domain}
            onChange={(v) => set("domain", v)}
          />
          <CategorySelect
            label="次領域"
            categoryKey="subDomain"
            value={form.subDomain}
            onChange={(v) => set("subDomain", v)}
            parentValue={form.domain}
          />
          <CategorySelect
            label="屬性"
            categoryKey="type"
            value={form.type}
            onChange={(v) => set("type", v)}
            multiple
          />

          {/* 私人是自己貼上去的標記，畫面上就是一顆開關 */}
          <PrivateToggle value={form.private} onChange={(v) => set("private", v)} />

          {/* 這本書留下來的東西：佳句、單字、關鍵字、書寫、文章，全部混在同一個 tag input 裡連結。
                跟上面的欄位同一組，不獨立分區——它也是一格「填表」，不是另一件事 */}
          <div className="col-span-full">
            {workId ? (
              <ContentLinkInput
                label="站內關聯"
                excludeId={workId}
                linked={linked}
                onLink={link}
                onUnlink={unlink}
              />
            ) : (
              <p className="rounded-control border-rule text-meta text-ink-faint border border-dashed px-3 py-2">
                存好這本書之後就可以連結佳句、單字、關鍵字、書寫、文章
              </p>
            )}
          </div>
        </Section>
      </div>
    </>
  );
}
