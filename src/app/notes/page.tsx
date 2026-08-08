"use client";

import { Suspense, useState } from "react";
import { Quote as QuoteIcon } from "lucide-react";
import { BooksGate } from "@/components/layout/BooksGate";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageMessage } from "@/components/layout/PageMessage";
import { NoteEditDialog } from "@/components/notes/NoteEditDialog";
import { QuoteEditDialog } from "@/components/notes/QuoteEditDialog";
import { RecordCard } from "@/components/notes/RecordCard";
import { getNoteRecords, getQuoteRecords, NoteRecord, QuoteRecord } from "@/lib/quoteStats";
import { useBookPatch } from "@/lib/useBookPatch";
import { useUrlParams } from "@/lib/useUrlParam";
import { Book, joinQuotes, parseQuotes } from "@/types/book";

const styles = {
  tabs: "flex items-center gap-1 rounded-lg border p-1",
  tab: "rounded px-3 py-1.5 text-sm font-medium",
  tabActive: "bg-gray-900 text-white",
  tabIdle: "text-gray-500 hover:bg-gray-100",
  // 內文長度差很多，排成多欄只會高高低低；一則一列反而好讀
  list: "flex flex-col gap-3",
  quote: "flex items-start gap-2",
  mark: "mt-0.5 shrink-0 text-[#B08A2E]",
  text: "text-sm leading-relaxed whitespace-pre-wrap text-gray-700",
  note: "border-l-2 pl-2 text-xs leading-relaxed text-gray-500",
  chapter: "text-[11px] text-gray-400",
};

const TABS = [
  { key: "quotes", label: "佳句" },
  { key: "notes", label: "心得" },
] as const;

type Tab = (typeof TABS)[number]["key"];

type TabButtonProps = {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
};

function TabButton({ active, onClick, children }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`${styles.tab} ${active ? styles.tabActive : styles.tabIdle}`}
    >
      {children}
    </button>
  );
}

function Quotes({ books }: { books: Book[] }) {
  const patchBook = useBookPatch();
  const [editing, setEditing] = useState<QuoteRecord | null>(null);
  const records = getQuoteRecords(books);

  /** 改回它來的那本書的那一行；刪除是整行拿掉 */
  async function save(record: QuoteRecord, remove: boolean) {
    const book = books.find((b) => b.id === record.bookId);
    if (!book) return;

    const quotes = parseQuotes(book.quotes).map((quote, i) =>
      i === record.index
        ? { text: record.text, chapter: record.chapter, note: record.note }
        : quote,
    );
    const next = remove ? quotes.filter((_, i) => i !== record.index) : quotes;
    await patchBook(record.bookId, { quotes: joinQuotes(next) });
  }

  if (records.length === 0) {
    return <PageMessage>還沒有記下任何佳句</PageMessage>;
  }

  return (
    <>
      <div className={styles.list}>
        {records.map((record) => (
          <RecordCard
            key={`${record.bookId}-${record.index}`}
            title={record.bookTitle}
            coverUrl={record.bookCover}
            onClick={() => setEditing(record)}
          >
            <div className={styles.quote}>
              <QuoteIcon size={14} strokeWidth={1.5} className={styles.mark} />
              <p className={styles.text}>{record.text}</p>
            </div>
            {record.note && <p className={styles.note}>{record.note}</p>}
            {record.chapter && <p className={styles.chapter}>{record.chapter}</p>}
          </RecordCard>
        ))}
      </div>

      {editing && (
        <QuoteEditDialog record={editing} onSave={save} onClose={() => setEditing(null)} />
      )}
    </>
  );
}

function Notes({ books }: { books: Book[] }) {
  const patchBook = useBookPatch();
  const [editing, setEditing] = useState<NoteRecord | null>(null);
  const records = getNoteRecords(books);

  if (records.length === 0) {
    return <PageMessage>還沒有寫下任何心得</PageMessage>;
  }

  return (
    <>
      <div className={styles.list}>
        {records.map((record) => (
          <RecordCard
            key={record.bookId}
            title={record.bookTitle}
            coverUrl={record.bookCover}
            onClick={() => setEditing(record)}
          >
            <p className={styles.text}>{record.note}</p>
          </RecordCard>
        ))}
      </div>

      {editing && (
        <NoteEditDialog
          record={editing}
          onSave={(next) => patchBook(next.bookId, { note: next.note })}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}

function NotesTabs() {
  // 看哪一邊寫在網址上，重新整理或分享連結都回得到同一個畫面；預設佳句
  const { searchParams, setParams } = useUrlParams();
  const tab: Tab = searchParams.get("tab") === "notes" ? "notes" : "quotes";
  const setTab = (next: Tab) => setParams({ tab: next === "quotes" ? null : next });

  return (
    <>
      <PageHeader
        title="筆記"
        action={
          <div className={styles.tabs}>
            {TABS.map((t) => (
              <TabButton key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
                {t.label}
              </TabButton>
            ))}
          </div>
        }
      />
      <BooksGate>
        {(books) => (tab === "quotes" ? <Quotes books={books} /> : <Notes books={books} />)}
      </BooksGate>
    </>
  );
}

/** 讀網址參數的元件要有 Suspense 邊界，靜態預先產生才不會失敗 */
export default function NotesPage() {
  return (
    <Suspense fallback={null}>
      <NotesTabs />
    </Suspense>
  );
}
