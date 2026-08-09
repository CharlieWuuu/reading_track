"use client";

import { Suspense, useState } from "react";
import { Quote as QuoteIcon } from "lucide-react";
import { KeywordCards } from "@/components/keywords/KeywordCards";
import { BooksGate } from "@/components/layout/BooksGate";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageMessage } from "@/components/layout/PageMessage";
import { NoteEditDialog } from "@/components/notes/NoteEditDialog";
import { QuoteEditDialog } from "@/components/notes/QuoteEditDialog";
import { RecordCard } from "@/components/notes/RecordCard";
import { VocabularySection } from "@/components/notes/VocabularySection";
import { useBookPatch } from "@/lib/useBookPatch";
import { useIsMobile } from "@/lib/useIsMobile";
import { useRecords } from "@/lib/useRecords";
import { useUrlParams } from "@/lib/useUrlParam";
import { getNoteRecords, getQuoteRecords, NoteRecord, QuoteRecord } from "@/lib/vocabularyStats";
import { Book } from "@/types/book";

const styles = {
  tabs: "flex items-center gap-1 rounded-lg border p-1",
  tab: "rounded px-3 py-1.5 text-sm font-medium",
  tabActive: "bg-gray-900 text-white",
  tabIdle: "text-gray-500 hover:bg-gray-100",
  // 內文長度差很多，排成多欄只會高高低低；一則一列往下排反而好讀
  list: "flex flex-col divide-y",
  // 引號上下框住句子：開頭在左上、結尾在右下，像被「」夾著。
  // w-fit 讓這一塊縮到跟句子一樣寬，短句的收尾引號才不會被推到整列的最右邊
  quote: "flex w-fit max-w-full flex-col gap-1",
  markOpen: "rotate-180 self-start text-[#B08A2E]",
  markClose: "self-end text-[#B08A2E]",
  text: "text-sm leading-relaxed whitespace-pre-wrap text-gray-700",
  note: "border-l-2 pl-2 text-xs leading-relaxed text-gray-500",
};

type Tab = "notes" | "quotes" | "vocabulary" | "keywords";

/**
 * 手機底部導覽只有五格，單字與關鍵字塞不進去，改成掛在筆記底下——
 * 它們本來就都是「從書裡摘出來的東西」。桌機側欄有各自的頁，就不重複。
 */
const TABS: { key: Tab; label: string; mobileOnly?: boolean }[] = [
  { key: "notes", label: "心得" },
  { key: "quotes", label: "佳句" },
  { key: "vocabulary", label: "單字", mobileOnly: true },
  { key: "keywords", label: "關鍵字", mobileOnly: true },
];

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
  const { quotes, saveBookRows } = useRecords();
  const [editing, setEditing] = useState<QuoteRecord | null>(null);
  const records = getQuoteRecords(quotes, books);

  /** 寫回去是「整本書的紀錄換一批」，所以把那本書的其他列原樣帶上 */
  async function save(record: QuoteRecord, remove: boolean) {
    const others = quotes.filter((row) => row.bookId === record.bookId && row.id !== record.id);
    const next = remove ? others : [...others, record];
    const book = books.find((b) => b.id === record.bookId);
    await saveBookRows("quotes", record.bookId, book?.title ?? "", next);
  }

  if (records.length === 0) {
    return <PageMessage>還沒有記下任何佳句</PageMessage>;
  }

  return (
    <>
      <div className={styles.list}>
        {records.map((record) => (
          <RecordCard
            key={record.id}
            title={record.bookTitle}
            coverUrl={record.bookCover}
            meta={record.chapter}
            onClick={() => setEditing(record)}
          >
            <div className={styles.quote}>
              <QuoteIcon size={12} strokeWidth={1.5} className={styles.markOpen} />
              <p className={styles.text}>{record.text}</p>
              <QuoteIcon size={12} strokeWidth={1.5} className={styles.markClose} />
            </div>
            {record.note && <p className={styles.note}>{record.note}</p>}
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
  // 看哪一邊寫在網址上，重新整理或分享連結都回得到同一個畫面；預設心得
  const { searchParams, setParams } = useUrlParams();
  const isMobile = useIsMobile();
  const param = searchParams.get("tab");
  const available = TABS.filter((t) => !t.mobileOnly || isMobile);
  // 桌機沒有單字／關鍵字這兩頁，網址帶著也退回心得
  const tab: Tab = available.some((t) => t.key === param) ? (param as Tab) : "notes";
  const setTab = (next: Tab) => setParams({ tab: next === "notes" ? null : next });

  return (
    <>
      <PageHeader
        title="筆記"
        action={
          <div className={styles.tabs}>
            {available.map((t) => (
              <TabButton key={t.key} active={tab === t.key} onClick={() => setTab(t.key)}>
                {t.label}
              </TabButton>
            ))}
          </div>
        }
      />
      <BooksGate>
        {(books) =>
          tab === "keywords" ? (
            <KeywordCards books={books} />
          ) : tab === "vocabulary" ? (
            <VocabularySection books={books} />
          ) : tab === "quotes" ? (
            <Quotes books={books} />
          ) : (
            <Notes books={books} />
          )
        }
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
