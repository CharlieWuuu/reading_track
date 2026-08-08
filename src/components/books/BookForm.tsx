"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useBooks } from "@/lib/useBooks";
import { useRecords } from "@/lib/useRecords";
import { useSheetStore } from "@/store/useSheetStore";
import { Book, inferStatus } from "@/types/book";
import { QuoteRow, VocabularyRow } from "@/types/record";
import { ArticleSelect } from "./ArticleSelect";
import { CategorySelect } from "./CategorySelect";
import { compactLines, LineListInput } from "./LineListInput";
import { QuoteListInput } from "./QuoteListInput";
import { VocabularyListInput } from "./VocabularyListInput";

const TEXTAREA_CLASS = "min-h-0 w-full flex-1 resize-none rounded border px-3 py-2 text-sm";

/** iOS 的原生日期控制項有自己的最小寬度，不關掉外觀就會撐破手機寬度 */
const DATE_INPUT_CLASS = "appearance-none";

/** 捲動模式下四塊平分高度會被壓扁，給個下限；分頁模式一次只顯示一塊，撐滿就夠 */
const TEXTAREA_MIN = "min-h-36";

const emptyForm = {
  sourceUrl: "",
  title: "",
  author: "",
  coverUrl: "",
  publisher: "",
  platform: "其他",
  startDate: "",
  endDate: "",
  domain: "",
  type: "",
  language: "",
  pageCount: "",
  wordCount: "",
  note: "",
  keywords: "",
  relatedArticles: "",
};

type FormState = typeof emptyForm;

/** 一組相關欄位排成同一片格線 */
function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-0 shrink-0 grid-cols-1 content-start gap-3 overflow-hidden sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  );
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
  const back = useSearchParams().get("back");
  const backHref = back ? `/books?${back}` : "/books";
  const { sheetId } = useSheetStore();
  const { mutate } = useBooks();
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
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [refetching, setRefetching] = useState(false);
  const [refetchNote, setRefetchNote] = useState("");
  const isEdit = Boolean(book);

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
        return next;
      });
      setRefetchNote(filled.length ? `補上 ${filled.length} 個空欄位` : "沒有可補的空欄位");
    } catch (err) {
      setRefetchNote(err instanceof Error ? err.message : "抓取失敗");
    } finally {
      setRefetching(false);
    }
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (!sheetId) {
      setSubmitError("請先到「設定」頁面連接 Google Sheet");
      return;
    }

    const payload = {
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
      type: form.type,
      language: form.language,
      pageCount: form.pageCount,
      wordCount: form.wordCount,
      note: form.note,
      // 舊欄位不再由 app 寫入，但也不主動清掉——遷移完再自己刪
      quotes: book?.quotes ?? "",
      vocabulary: book?.vocabulary ?? "",
      keywords: compactLines(form.keywords),
      relatedArticles: form.relatedArticles,
    };

    setSubmitting(true);
    setSubmitError("");
    try {
      let savedId = book?.id ?? "";
      if (isEdit && book) {
        const res = await fetch(`/api/books/${book.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sheetId, patch: payload }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "更新失敗");
      } else {
        const newBook: Book = { id: crypto.randomUUID(), ...payload };
        const res = await fetch("/api/books", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sheetId, book: newBook }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "新增失敗");
        savedId = newBook.id;
      }

      // 紀錄要等書存好才寫得進去：它們靠書籍編號認人，新增時那個編號才剛生出來
      await saveBookRows(
        "vocabulary",
        savedId,
        form.title,
        vocabularyRows.map((row) => ({ ...row, bookId: savedId, bookTitle: form.title })),
      );
      await saveBookRows(
        "quotes",
        savedId,
        form.title,
        quoteRows.map((row) => ({ ...row, bookId: savedId, bookTitle: form.title })),
      );

      await mutate();
      router.push(backHref);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!book || !sheetId) return;

    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`/api/books/${book.id}?sheetId=${encodeURIComponent(sheetId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "刪除失敗");
      }
      await mutate(
        (current) => ({ books: (current?.books ?? []).filter((b) => b.id !== book.id) }),
        { revalidate: false },
      );
      router.push(backHref);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "刪除失敗");
      setSubmitting(false);
      setConfirmDelete(false);
    }
  }

  // 跟其他頁一致：撐滿可用高度，靠三欄排版讓欄位在一頁內看完，不整頁捲動
  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-full min-h-0 flex-col gap-3 rounded-lg border bg-white p-4 sm:p-5"
    >
      {notice && (
        <p className="shrink-0 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {notice}
        </p>
      )}

      {/* 欄位一路往下排，整份表單直接捲 */}
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
        <Section>
          <Field label="書名" value={form.title} onChange={(v) => set("title", v)} required />
          <Field label="作者" value={form.author} onChange={(v) => set("author", v)} />
          <Field label="出版社" value={form.publisher} onChange={(v) => set("publisher", v)} />
        </Section>

        <Section>
          <Field label="封面 URL" value={form.coverUrl} onChange={(v) => set("coverUrl", v)} />
          <Field label="來源網址" value={form.sourceUrl} onChange={(v) => set("sourceUrl", v)} />

          <CategorySelect
            label="平台"
            categoryKey="platform"
            value={form.platform}
            onChange={(v) => set("platform", v)}
          />

          {/* 用現有的書名／網址重查，補上空欄位 */}
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-3">
            <button
              type="button"
              onClick={handleRefetch}
              disabled={refetching}
              className="rounded border px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              {refetching ? "抓取中…" : "重新抓取資料"}
            </button>
            {refetchNote && <span className="text-xs text-gray-500">{refetchNote}</span>}
          </div>
        </Section>

        <Section>
          {/* 短欄位在手機兩兩並排；sm:contents 讓它在桌機溶解回原本的格線 */}
          <div className="grid grid-cols-2 gap-3 sm:contents">
            <Field label="頁數" value={form.pageCount} onChange={(v) => set("pageCount", v)} />
            <Field label="字數" value={form.wordCount} onChange={(v) => set("wordCount", v)} />
          </div>

          {/* 日期在手機各佔一行：iOS 的原生日期控制項有最小寬度，兩兩並排會互相擠壓 */}
          <div className="grid min-w-0 grid-cols-1 gap-3 sm:contents">
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
          </div>
        </Section>

        <Section>
          <CategorySelect
            label="領域"
            categoryKey="domain"
            value={form.domain}
            onChange={(v) => set("domain", v)}
            multiple
          />
          <CategorySelect
            label="屬性"
            categoryKey="type"
            value={form.type}
            onChange={(v) => set("type", v)}
            multiple
          />
          <CategorySelect
            label="語言"
            categoryKey="language"
            value={form.language}
            onChange={(v) => set("language", v)}
          />
        </Section>

        {/* 筆記與佳句吃掉剩下的高度，欄位多寡不同時都不會擠出捲軸 */}
        <div className="flex min-h-0 shrink-0 flex-col gap-3 sm:flex-row">
          <div className="flex min-h-0 flex-1 flex-col gap-1">
            <label className="shrink-0 text-sm font-medium">筆記</label>
            <textarea
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              className={`${TEXTAREA_CLASS} ${TEXTAREA_MIN}`}
            />
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-1">
            <label className="flex shrink-0 items-baseline gap-2 text-sm font-medium">
              佳句
              <span className="text-xs font-normal text-gray-400">一句一組，章節可留空</span>
            </label>
            <QuoteListInput rows={quoteRows} onChange={setQuoteRows} />
          </div>
        </div>

        {/*
        關鍵字與相關文章。跟筆記同樣是一行一筆的自由文字——記的當下不分類，
        要畫成地圖還是清單是之後看的時候的事。
      */}
        <div className="flex min-h-0 shrink-0 flex-col gap-3 sm:flex-row">
          <div className="flex min-h-0 flex-1 flex-col gap-1">
            <label className="flex shrink-0 items-baseline gap-2 text-sm font-medium">
              關鍵字
              <span className="text-xs font-normal text-gray-400">
                一個一組：地名、人名、事件、專有名詞
              </span>
            </label>
            <LineListInput
              value={form.keywords}
              onChange={(v) => set("keywords", v)}
              placeholder="京都"
            />
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-1">
            <label className="flex shrink-0 items-baseline gap-2 text-sm font-medium">
              相關文章
              <span className="text-xs font-normal text-gray-400">一行一個 Instapaper 網址</span>
            </label>
            <ArticleSelect
              value={form.relatedArticles}
              onChange={(v) => set("relatedArticles", v)}
            />
            <textarea
              value={form.relatedArticles}
              onChange={(e) => set("relatedArticles", e.target.value)}
              placeholder={"https://www.instapaper.com/read/1234567890"}
              className={`${TEXTAREA_CLASS} ${TEXTAREA_MIN}`}
            />
          </div>
        </div>

        <div className="flex min-h-0 shrink-0 flex-col gap-1">
          <label className="flex shrink-0 items-baseline gap-2 text-sm font-medium">
            單字
            <span className="text-xs font-normal text-gray-400">
              一個一組，例句與章節可留空；刻意不跨書共用
            </span>
          </label>
          <VocabularyListInput
            rows={vocabularyRows}
            onChange={setVocabularyRows}
            bookLanguage={form.language}
          />
        </div>
      </div>

      {submitError && <p className="shrink-0 text-xs text-red-600">{submitError}</p>}

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={submitting}
            className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
          >
            {submitting ? "儲存中…" : isEdit ? "儲存變更" : "新增書籍"}
          </button>

          {/* 誤點進編輯頁時的退路：不存檔就回書單，省下一次寫入 */}
          <Link
            href={backHref}
            className="rounded border px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            返回
          </Link>
        </div>

        {/* 刪除只出現在編輯頁，按一次先要求確認，避免誤刪 */}
        {isEdit &&
          (confirmDelete ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">確定刪除這本書？</span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="rounded bg-red-600 px-3 py-1.5 font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                刪除
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded border px-3 py-1.5 text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={submitting}
              className="text-xs text-red-600 hover:underline disabled:opacity-50"
            >
              刪除這本書
            </button>
          ))}
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="min-w-0">
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className={`box-border block w-full max-w-full min-w-0 rounded border px-3 py-2 text-sm ${
          type === "date" ? DATE_INPUT_CLASS : ""
        }`}
      />
    </div>
  );
}
