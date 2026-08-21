"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  CalendarCheck,
  CalendarPlus,
  FileText,
  Languages,
  Link as LinkIcon,
  Newspaper,
  Quote,
  Store,
  Tag,
  Type,
} from "lucide-react";
import { CategorySelect } from "@/components/ui/category-select";
import { Field } from "@/components/ui/field";
import { FormActions } from "@/components/ui/form-actions";
import { compactLines, LineListInput } from "@/components/ui/line-list-input";
import { OptionSelect } from "@/components/ui/option-select";
import { PrivateToggle } from "@/components/ui/private-toggle";
import { useBookFormTab } from "@/features/books/components/book-form-tabs";
import { QuoteListInput } from "@/features/books/components/quote-list-input";
import { VocabularyListInput } from "@/features/books/components/vocabulary-list-input";
import { RelatedEntries } from "@/features/entries/components/related-entries";
import { useBooks } from "@/hooks/use-books";
import { useRecordForm } from "@/hooks/use-record-form";
import { useRecords } from "@/hooks/use-records";
import { useUrlParams } from "@/hooks/use-url-param";
import { keywordEditHref, useCurrentHref } from "@/lib/keywords/href";
import { fullerTitle } from "@/lib/metadata";
import { Book, inferStatus, splitLines } from "@/types/book";
import { QuoteRow, VocabularyRow } from "@/types/record";

const emptyForm = {
  private: "",
  sourceUrl: "",
  title: "",
  author: "",
  coverUrl: "",
  publisher: "",
  platform: "其他",
  startDate: "",
  endDate: "",
  domain: "",
  subDomain: "",
  type: "",
  language: "",
  pageCount: "",
  wordCount: "",
  note: "",
  keywords: "",
  relatedArticles: "",
};

type FormState = typeof emptyForm;

/** 沒選到的分頁留在畫面上但藏起來，切回來時打到一半的內容還在 */
function TabPanel({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex-col gap-3 md:min-h-0 md:flex-1 ${active ? "flex" : "hidden"}`}>
      {children}
    </div>
  );
}

/** 送出去的那一份：舊欄位原樣帶回去，狀態一律由日期推導 */
function toPayload(form: FormState, book?: Book) {
  return {
    title: form.title,
    author: form.author,
    coverUrl: form.coverUrl,
    publisher: form.publisher,
    platform: form.platform,
    sourceUrl: form.sourceUrl,
    // 狀態不給使用者填，一律由日期推導，避免狀態跟日期互相矛盾
    status: inferStatus(form.startDate || null, form.endDate || null),
    startDate: form.startDate || null,
    endDate: form.endDate || null,
    domain: form.domain,
    subDomain: form.subDomain,
    type: form.type,
    language: form.language,
    pageCount: form.pageCount,
    wordCount: form.wordCount,
    private: form.private,
    // 心得搬到紀事了，這一欄不再由 app 寫入，但也不主動清掉——遷移完再自己刪
    note: book?.note ?? "",
    // 舊欄位不再由 app 寫入，但也不主動清掉——遷移完再自己刪
    quotes: book?.quotes ?? "",
    vocabulary: book?.vocabulary ?? "",
    keywords: compactLines(form.keywords),
    relatedArticles: form.relatedArticles,
  };
}

/** 一組相關欄位排成同一片格線；pairs 是固定兩欄，手機也不折成一欄 */
function Section({ children, pairs }: { children: React.ReactNode; pairs?: boolean }) {
  const cols = pairs ? "grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
  return <div className={`grid min-h-0 shrink-0 content-start gap-3 ${cols}`}>{children}</div>;
}

async function scrapeByUrl(url: string): Promise<Partial<Book> | null> {
  const res = await fetch("/api/scrape", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.title ? data : null;
}

async function searchByTitle(title: string): Promise<Partial<Book> | null> {
  const res = await fetch(`/api/search-book?q=${encodeURIComponent(title)}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.results?.[0] ?? null;
}

function toForm(book: Partial<Book>): FormState {
  return {
    ...emptyForm,
    ...Object.fromEntries(Object.entries(book).filter(([, v]) => v !== undefined && v !== null)),
    startDate: book.startDate ?? "",
    endDate: book.endDate ?? "",
  } as FormState;
}

export function BookForm({
  book,
  initial,
  notice,
}: {
  /** 編輯既有書籍 */
  book?: Book;
  /** 新增時，由查詢步驟帶進來的預填資料 */
  initial?: Partial<Book>;
  /** 查詢步驟要轉達的訊息（例如查不到） */
  notice?: string;
}) {
  const router = useRouter();
  // 從書單進來時會帶著檢視方式與頁碼，存完要回到同一頁
  const { searchParams } = useUrlParams();
  const back = searchParams.get("back");
  const listHref = back ? `/reading/books?${back}` : "/reading/books";
  // 編輯是從書籍資訊進來的，離開就回那一頁；新增沒有資訊頁可回，直接回書單
  const backHref = book
    ? `/books/${book.id}${back ? `?back=${encodeURIComponent(back)}` : ""}`
    : listHref;

  const { tab, setTab } = useBookFormTab();
  const from = useCurrentHref();
  const { books: allBooks, mutate } = useBooks();
  // 已經用過的關鍵字拿來當建議，免得同一個東西被打成兩種寫法
  const keywordSuggestions = [...new Set(allBooks.flatMap((b) => splitLines(b.keywords)))].sort(
    (a, b) => a.localeCompare(b, "zh-Hant"),
  );
  // 單字與佳句各自一張表，跟著這本書一起存
  const { vocabulary, quotes, saveBookRows } = useRecords();
  const bookId = book?.id ?? "";
  const [vocabularyRows, setVocabularyRows] = useState<VocabularyRow[]>([]);
  const [quoteRows, setQuoteRows] = useState<QuoteRow[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  // 紀錄是非同步抓回來的，抓到之後才填得進來；換一本書也要重填
  if (loadedFor !== bookId) {
    setLoadedFor(bookId);
    setVocabularyRows(vocabulary.filter((row) => row.bookId === bookId));
    setQuoteRows(quotes.filter((row) => row.bookId === bookId));
  }
  const [form, setForm] = useState<FormState>(toForm(book ?? initial ?? {}));
  const [refetching, setRefetching] = useState(false);
  const [refetchNote, setRefetchNote] = useState("");
  const isEdit = Boolean(book);

  const {
    submitting,
    error: submitError,
    setError: setSubmitError,
    handleSubmit,
    handleDelete,
    openRecordThen,
  } = useRecordForm({
    resource: "books",
    bodyKey: "book",
    existingId: book?.id ?? "",
    payload: toPayload(form, book),
    redirectTo: backHref,
    deleteRedirectTo: listHref,
    mutate,
    validate: () => (form.title.trim() ? undefined : "請填書名"),
    // 佳句與單字靠書籍編號認人，新增時那個編號要等書存完才生得出來
    onSaved: async (id) => {
      const withBook = <T extends { bookId: string; bookTitle: string }>(rows: T[]) =>
        rows.map((row) => ({ ...row, bookId: id, bookTitle: form.title }));
      await saveBookRows("vocabulary", id, form.title, withBook(vocabularyRows));
      await saveBookRows("quotes", id, form.title, withBook(quoteRows));
    },
  });

  /** 點關鍵字跳到那個字的編輯頁；沒填書名就先擋下來，不然新增頁沒東西可落地 */
  function openKeyword(name: string) {
    if (!form.title.trim()) {
      setTab("book");
      setSubmitError("請先填書名");
      return;
    }
    openRecordThen((back) => router.push(keywordEditHref(name, back)), from);
  }

  /**
   * 用現在表單裡的書名／網址重查一次。刻意只補空欄位——
   * 使用者手動改過的內容比外部來源可信，不能被一鍵蓋掉。
   */
  async function handleRefetch() {
    const url = form.sourceUrl.trim();
    const title = form.title.trim();
    if (!url && !title) {
      setRefetchNote("請先填書名或來源網址");
      return;
    }

    setRefetching(true);
    setRefetchNote("");
    try {
      const found = url ? await scrapeByUrl(url) : await searchByTitle(title);
      if (!found) {
        setRefetchNote("查不到這本書的資料");
        return;
      }

      const filled: string[] = [];
      setForm((f) => {
        const next = { ...f };
        for (const [key, value] of Object.entries(found)) {
          const k = key as keyof FormState;
          if (!(k in next) || typeof value !== "string" || !value.trim()) continue;
          if (String(next[k] ?? "").trim()) continue;
          (next[k] as string) = value;
          filled.push(k);
        }
        // 書名是唯一的例外：抓到更完整的版本（多半是補上副標題）就換掉
        const fuller = fullerTitle(f.title, found.title);
        if (fuller) {
          next.title = fuller;
          filled.push("title");
        }
        return next;
      });
      setRefetchNote(filled.length ? `補上 ${filled.length} 個欄位` : "沒有可補的欄位");
    } catch (err) {
      setRefetchNote(err instanceof Error ? err.message : "抓取失敗");
    } finally {
      setRefetching(false);
    }
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    // 書名在「書籍」那一頁，沒填時要先切過去，不然錯誤訊息旁邊是空的
    <form
      onSubmit={(e) => {
        if (!form.title.trim()) setTab("book");
        handleSubmit(e);
      }}
      className="flex flex-col gap-3 md:h-full md:min-h-0"
    >
      {notice && (
        <p className="shrink-0 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {notice}
        </p>
      )}

      {/* 欄位一路往下排；桌機在這層捲，手機不自己捲，跟著整頁捲 */}
      <div className="flex flex-col gap-3 md:min-h-0 md:flex-1 md:overflow-y-auto">
        <TabPanel active={tab === "book"}>
          {/* 這一頁的欄位兩兩成對（作者｜出版社、頁數｜字數…），書名自己獨佔一行 */}
          <div className="grid min-h-0 shrink-0 grid-cols-2 content-start gap-3">
            <div className="col-span-2">
              <Field label="書名" value={form.title} onChange={(v) => set("title", v)} />
            </div>

            <Field label="作者" value={form.author} onChange={(v) => set("author", v)} />
            <Field label="出版社" value={form.publisher} onChange={(v) => set("publisher", v)} />

            <Field label="封面網址" value={form.coverUrl} onChange={(v) => set("coverUrl", v)} />
            <Field
              label="來源網址"
              Icon={LinkIcon}
              value={form.sourceUrl}
              onChange={(v) => set("sourceUrl", v)}
            />

            {/* 這三個都很短，擠成一行剛好，不用各佔半排 */}
            <div className="col-span-2 grid grid-cols-3 gap-3">
              <Field
                label="頁數"
                Icon={FileText}
                value={form.pageCount}
                onChange={(v) => set("pageCount", v)}
              />
              <Field
                label="字數"
                Icon={Type}
                value={form.wordCount}
                onChange={(v) => set("wordCount", v)}
              />
              <CategorySelect
                label="語言"
                Icon={Languages}
                categoryKey="language"
                value={form.language}
                onChange={(v) => set("language", v)}
              />
            </div>

            {/* 用現有的書名／網址重查，補上空欄位 */}
            <div className="col-span-2 flex items-center justify-end gap-2">
              {refetchNote && <span className="text-xs text-gray-500">{refetchNote}</span>}
              <button
                type="button"
                onClick={handleRefetch}
                disabled={refetching}
                className="rounded border px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                {refetching ? "抓取中…" : "重新抓取資料"}
              </button>
            </div>
          </div>
        </TabPanel>

        <TabPanel active={tab === "tags"}>
          <Section pairs>
            <Field
              label="開始日期"
              Icon={CalendarPlus}
              type="date"
              value={form.startDate}
              onChange={(v) => set("startDate", v)}
            />
            <Field
              label="完成日期"
              Icon={CalendarCheck}
              type="date"
              value={form.endDate}
              onChange={(v) => set("endDate", v)}
            />
          </Section>

          <Section pairs>
            {/* 平台是「我在哪讀的」，跟書本身無關，所以跟其他自訂分類放一起 */}
            <CategorySelect
              label="平台"
              Icon={Store}
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
            />
            <CategorySelect
              label="屬性"
              categoryKey="type"
              value={form.type}
              onChange={(v) => set("type", v)}
              multiple
            />
          </Section>

          {/* 私人跟領域、屬性一樣是自己貼上去的標記，所以也放這一頁 */}
          <PrivateToggle value={form.private} onChange={(v) => set("private", v)} />

          {/* 關鍵字也是自己貼上去的標籤，跟領域、屬性同一件事，只是值不固定 */}
          <div className="min-w-0 shrink-0">
            <OptionSelect
              label="關鍵字"
              Icon={Tag}
              options={keywordSuggestions}
              value={form.keywords}
              onChange={(v) => set("keywords", v)}
              onEditOption={openKeyword}
              placeholder="一個一組：地名、人名、事件、專有名詞"
              separator={"\n"}
              multiple
            />
          </div>
        </TabPanel>

        {/* 佳句與單字都是從書裡抄出來的片段，連操作都一樣：清單點一列開彈窗 */}
        {/* 兩邊都是 w-1/2：內容長短不一樣，不加 min-w-0 的話長的那邊會把短的擠掉 */}
        <TabPanel active={tab === "excerpt"}>
          <div className="flex min-h-0 flex-col gap-3 sm:flex-row md:flex-1">
            <div className="flex min-h-0 w-full min-w-0 flex-col gap-1 sm:w-1/2">
              <label className="flex shrink-0 items-center gap-1.5 text-sm font-medium">
                <Quote size={14} strokeWidth={1.5} className="shrink-0 text-gray-400" />
                佳句
                <span className="text-xs font-normal text-gray-400">點一句可以編輯</span>
              </label>
              <QuoteListInput rows={quoteRows} onChange={setQuoteRows} />
            </div>

            <div className="flex min-h-0 w-full min-w-0 flex-col gap-1 sm:w-1/2">
              <label className="flex shrink-0 items-center gap-1.5 text-sm font-medium">
                <BookOpen size={14} strokeWidth={1.5} className="shrink-0 text-gray-400" />
                單字
                <span className="text-xs font-normal text-gray-400">點一個可以編輯</span>
              </label>
              <VocabularyListInput
                rows={vocabularyRows}
                onChange={setVocabularyRows}
                bookLanguage={form.language}
              />
            </div>
          </div>
        </TabPanel>

        {/* 心得寫成紀事，這裡只列出這本書底下有哪些 */}
        <TabPanel active={tab === "notes"}>
          <div className="flex min-h-0 flex-col gap-3 sm:flex-row md:flex-1">
            <div className="flex min-h-0 w-full min-w-0 flex-col gap-1 sm:w-1/2">
              {isEdit && book ? (
                <RelatedEntries sourceId={book.id} sourceTitle={form.title} kind="書籍" />
              ) : (
                <p className="rounded border border-dashed px-3 py-2 text-xs text-gray-400">
                  存好這本書之後就可以寫心得了
                </p>
              )}
            </div>

            <div className="flex min-h-0 w-full min-w-0 flex-col gap-1 sm:w-1/2">
              <label className="flex shrink-0 items-center gap-1.5 text-sm font-medium">
                <Newspaper size={14} strokeWidth={1.5} className="shrink-0 text-gray-400" />
                相關文章
                <span className="text-xs font-normal text-gray-400">一行一個網址</span>
              </label>
              <LineListInput
                value={form.relatedArticles}
                onChange={(v) => set("relatedArticles", v)}
                placeholder="https://…"
              />
            </div>
          </div>
        </TabPanel>
      </div>

      <FormActions
        saving={submitting}
        saveLabel={isEdit ? "儲存變更" : "新增書籍"}
        onDelete={isEdit ? handleDelete : undefined}
        deleteLabel="刪除這本書"
        confirmLabel="確定刪除這本書？"
        error={submitError}
      />
    </form>
  );
}
