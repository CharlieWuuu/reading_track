"use client";

import { useState } from "react";
import { FormActions } from "@/components/ui/form-actions";
import { kindHref } from "@/config/kind-routes";
import { bookEditHref, bookHref } from "@/config/routes";
import { BookFieldsPanel } from "@/features/books/components/book-fields-panel";
import { useBookRefetch } from "@/features/books/hooks/use-book-refetch";
import { useBooks } from "@/hooks/use-books";
import { useEntryForm } from "@/hooks/use-entry-form";
import { useRecordForm } from "@/hooks/use-record-form";
import { useUrlParams } from "@/hooks/use-url-param";
import { Book, inferStatus } from "@/types/book";

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
};

type FormState = typeof emptyForm;

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
    // 關鍵字搬到站內關聯了，這一欄不再由 app 寫入，但也不主動清掉——遷移完再自己刪
    keywords: book?.keywords ?? "",
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
  // 從書單進來時會帶著檢視方式與頁碼，存完要回到同一頁
  const { searchParams } = useUrlParams();
  const back = searchParams.get("back");
  const booksListHref = kindHref("records", "books");
  const listHref = back ? `${booksListHref}?${back}` : booksListHref;
  // 編輯是從書籍資訊進來的，離開就回那一頁；新增沒有資訊頁可回，直接回書單
  const backHref = book ? bookHref(book.id, back) : listHref;

  const { books: allBooks, mutate } = useBooks();
  const { form, set, update } = useEntryForm(book, (b) => toForm(b ?? initial ?? {}));
  const isEdit = Boolean(book);
  const [pickNotice, setPickNotice] = useState("");

  const {
    submitting,
    error: submitError,
    handleSubmit,
    handleDelete,
  } = useRecordForm({
    resource: "books",
    editHref: bookEditHref,
    existingId: book?.id ?? "",
    payload: toPayload(form, book),
    redirectTo: backHref,
    deleteRedirectTo: listHref,
    mutate,
    validate: () => (form.title.trim() ? undefined : "請填書名"),
  });

  useBookRefetch(form, update);

  /**
   * 重讀：直接帶上次那筆，只留下「這次才會不同的」三欄不帶。
   *
   * 狀態不用清——它是從日期推出來的（見 `types/book.ts` 的 `inferStatus`），
   * 日期空著就自動回到「想讀」。
   */
  function pickReadBook(picked: Book) {
    update(() => toForm({ ...picked, startDate: null, endDate: null, note: "" }));
    setPickNotice("已帶入上次讀這本書的資料。日期與心得留空，其餘照舊。");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 md:h-full md:min-h-0">
      {(notice || pickNotice) && (
        <p className="rounded-control border-rule bg-surface-sunken text-ink-secondary shrink-0 border px-3 py-2 text-xs">
          {notice || pickNotice}
        </p>
      )}

      {/* 桌機在這層捲，手機不自己捲，跟著整頁捲 */}
      <div className="flex flex-col gap-10 md:min-h-0 md:flex-1 md:overflow-y-auto">
        <BookFieldsPanel
          form={form}
          set={(key, value) => set(key as keyof FormState, value)}
          titleSuggestions={isEdit ? undefined : { books: allBooks, onPick: pickReadBook }}
          workId={isEdit && book ? book.workId : null}
        />
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
