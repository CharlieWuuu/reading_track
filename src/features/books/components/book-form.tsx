"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormActions } from "@/components/ui/form-actions";
import { compactLines } from "@/components/ui/line-list-input";
import { bookEditHref, bookHref, keywordEditHref, writingNewHref } from "@/config/routes";
import { BookFieldsPanel } from "@/features/books/components/book-fields-panel";
import { useBookFormTab } from "@/features/books/components/book-form-tabs";
import { BookRecordPanel } from "@/features/books/components/book-record-panel";
import { useBookRefetch } from "@/features/books/hooks/use-book-refetch";
import { useBooks } from "@/hooks/use-books";
import { useEntryForm } from "@/hooks/use-entry-form";
import { useRecordForm } from "@/hooks/use-record-form";
import { useRecords } from "@/hooks/use-records";
import { useUrlParams } from "@/hooks/use-url-param";
import { useCurrentHref } from "@/lib/keywords/href";
import { Book, inferStatus, splitLines } from "@/types/book";
import { QuoteRow, VocabularyRow } from "@/types/record";
import { sameBook } from "@/utils/book-reads";

const emptyForm = {
  private: "",
  sourceUrl: "",
  title: "",
  author: "",
  coverUrl: "",
  publisher: "",
  isbn: "",
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
    <div className={`flex-col gap-10 md:min-h-0 md:flex-1 ${active ? "flex" : "hidden"}`}>
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
    isbn: form.isbn,
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
  const backHref = book ? bookHref(book.id, back) : listHref;

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
  // 背景重抓回來的資料要蓋掉畫面上的舊快取——但只在使用者還沒動過的時候
  const { form, set, update } = useEntryForm(book, (b) => toForm(b ?? initial ?? {}));
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
    editHref: bookEditHref,
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

  /** 心得寫成一則書寫；先把這本書存完再跳，不讓兩邊的寫入同時進行 */
  function openWriting(id: string) {
    openRecordThen(
      () => router.push(writingNewHref({ sourceId: id, sourceTitle: form.title, kind: "書籍" })),
      from,
    );
  }

  useBookRefetch(form, update);

  return (
    // 書名在「書籍」那一頁，沒填時要先切過去，不然錯誤訊息旁邊是空的
    <form
      onSubmit={(e) => {
        if (!form.title.trim()) setTab("book");
        handleSubmit(e);
      }}
      className="flex flex-col gap-6 md:h-full md:min-h-0"
    >
      {notice && (
        <p className="rounded-control shrink-0 border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {notice}
        </p>
      )}

      {/* 桌機在這層捲，手機不自己捲，跟著整頁捲。
          這層的子元素是分頁，同時只有一個看得到，所以不需要 gap——
          分組之間的距離在 TabPanel 上 */}
      <div className="flex flex-col md:min-h-0 md:flex-1 md:overflow-y-auto">
        <TabPanel active={tab === "book"}>
          <BookFieldsPanel
            form={form}
            set={(key, value) => set(key as keyof FormState, value)}
            keywordSuggestions={keywordSuggestions}
            onEditKeyword={openKeyword}
          />
        </TabPanel>

        {/* 從這本書留下來的東西：佳句、單字、書寫、相關文章，全站叫什麼這裡就叫什麼 */}
        <TabPanel active={tab === "record"}>
          <BookRecordPanel
            quoteRows={quoteRows}
            onQuotes={setQuoteRows}
            vocabularyRows={vocabularyRows}
            onVocabulary={setVocabularyRows}
            bookLanguage={form.language}
            relatedArticles={form.relatedArticles}
            onRelatedArticles={(v) => set("relatedArticles", v)}
            writingSourceIds={isEdit && book ? sameBook(allBooks, book).map((b) => b.id) : null}
            onWrite={() => book && openWriting(book.id)}
          />
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
