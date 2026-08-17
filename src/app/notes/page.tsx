"use client";

import { Suspense, useState } from "react";
import {
  KEYWORD_VIEWS,
  KeywordsSection,
  type KeywordView,
} from "@/components/keywords/KeywordsSection";
import { BooksGate } from "@/components/layout/BooksGate";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageMessage } from "@/components/layout/PageMessage";
import { QuoteEditDialog } from "@/components/notes/QuoteEditDialog";
import { RecordCard } from "@/components/notes/RecordCard";
import { QuoteBlock } from "@/components/notes/RecordItems";
import { ReflectionSection } from "@/components/notes/ReflectionSection";
import { VocabularySection } from "@/components/notes/VocabularySection";
import { TabBar } from "@/components/ui/Controls";
import { useRecords } from "@/lib/useRecords";
import { useUrlParams } from "@/lib/useUrlParam";
import { getQuoteRecords, QuoteRecord } from "@/lib/vocabularyStats";
import { Book } from "@/types/book";

const styles = {
  // 內文長度差很多，排成多欄只會高高低低；一則一列往下排反而好讀
  list: "flex flex-col divide-y",
};

type Tab = "notes" | "quotes" | "vocabulary" | "keywords";

/**
 * 單字與關鍵字掛在筆記底下——它們本來就都是「從書裡摘出來的東西」。
 * 桌機與手機同一套分法，側欄不再另外開兩頁。
 */
const TABS: { key: Tab; label: string }[] = [
  { key: "notes", label: "心得" },
  { key: "quotes", label: "佳句" },
  { key: "vocabulary", label: "單字" },
  { key: "keywords", label: "關鍵字" },
];

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
            onClick={() => setEditing(record)}
          >
            <QuoteBlock quote={record} />
          </RecordCard>
        ))}
      </div>

      {editing && (
        <QuoteEditDialog record={editing} onSave={save} onClose={() => setEditing(null)} />
      )}
    </>
  );
}

function NotesTabs() {
  // 看哪一邊寫在網址上，重新整理或分享連結都回得到同一個畫面；預設心得
  const { searchParams, setParams } = useUrlParams();
  const param = searchParams.get("tab");
  const tab: Tab = TABS.some((t) => t.key === param) ? (param as Tab) : "notes";
  // 選單裡標粗體的是「正在看的那一種」，所以直接讀網址：沒選過就四個都一樣
  const view = searchParams.get("view") ?? "";
  // 換分頁時把看法與關鍵字篩選一起清掉，下次進來都是從頭開始
  const setTab = (next: Tab) =>
    setParams({ tab: next === "notes" ? null : next, view: null, keyword: null });
  // 換頁與換看法要同一次寫進網址，分兩次呼叫後面那次會蓋掉前面那次
  const openKeywordView = (next: KeywordView) => setParams({ tab: "keywords", view: next });

  return (
    <>
      <PageHeader
        title="筆記"
        action={
          <TabBar
            items={TABS}
            value={tab}
            onChange={setTab}
            // 關鍵字有四種看法，點分頁就把選單放下來，不另外佔一列
            menu={{
              for: "keywords",
              items: KEYWORD_VIEWS,
              value: view,
              onChange: (next) => openKeywordView(next as KeywordView),
            }}
          />
        }
      />
      <PageBody>
        <BooksGate>
          {(books) =>
            tab === "keywords" ? (
              <KeywordsSection books={books} showSwitch={false} />
            ) : tab === "vocabulary" ? (
              <VocabularySection books={books} />
            ) : tab === "quotes" ? (
              <Quotes books={books} />
            ) : (
              <ReflectionSection books={books} />
            )
          }
        </BooksGate>
      </PageBody>
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
