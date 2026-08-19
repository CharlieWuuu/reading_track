"use client";

import { useRouter } from "next/navigation";
import { Suspense } from "react";
import { BooksGate } from "@/components/layout/books-gate";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { PageMessage } from "@/components/layout/page-message";
import { TabBar } from "@/components/ui/controls";
import {
  KEYWORD_VIEWS,
  KeywordsSection,
  type KeywordView,
} from "@/features/keywords/components/keywords-section";
import { RecordCard } from "@/features/notes/components/record-card";
import { QuoteBlock } from "@/features/notes/components/record-items";
import { VocabularySection } from "@/features/notes/components/vocabulary-section";
import { useRecords } from "@/hooks/useRecords";
import { useUrlParams } from "@/hooks/useUrlParam";
import { Book } from "@/types/book";
import { getQuoteRecords } from "@/utils/vocabularyStats";

const styles = {
  // 內文長度差很多，排成多欄只會高高低低；一則一列往下排反而好讀
  // 分隔線跟書寫那條同一級：淡到只是把兩則隔開，不搶內容
  list: "flex flex-col divide-y divide-gray-100",
};

type Tab = "quotes" | "vocabulary" | "keywords";

/**
 * 單字與關鍵字掛在筆記底下——它們本來就都是「從書裡摘出來的東西」。
 * 桌機與手機同一套分法，側欄不再另外開兩頁。
 */
const TABS: { key: Tab; label: string }[] = [
  { key: "quotes", label: "佳句" },
  { key: "vocabulary", label: "單字" },
  { key: "keywords", label: "關鍵字" },
];

function Quotes({ books }: { books: Book[] }) {
  const router = useRouter();
  const { quotes, isLoading } = useRecords();
  const records = getQuoteRecords(quotes, books);

  if (isLoading) return <PageMessage>載入中…</PageMessage>;

  if (records.length === 0) {
    return <PageMessage>還沒有記下任何佳句</PageMessage>;
  }

  return (
    <div className={styles.list}>
      {records.map((record) => (
        <RecordCard
          key={record.id}
          title={record.bookTitle}
          showTitle={false}
          coverUrl={record.bookCover}
          onClick={() => router.push(`/quotes/${record.id}/edit`)}
        >
          <QuoteBlock quote={record} />
        </RecordCard>
      ))}
    </div>
  );
}

function NotesTabs() {
  // 看哪一邊寫在網址上，重新整理或分享連結都回得到同一個畫面；預設佳句
  const { searchParams, setParams } = useUrlParams();
  const param = searchParams.get("tab");
  const tab: Tab = TABS.some((t) => t.key === param) ? (param as Tab) : "quotes";
  // 選單裡標粗體的是「正在看的那一種」，所以直接讀網址：沒選過就四個都一樣
  const view = searchParams.get("view") ?? "";
  // 換到別的分頁就把看法清掉，下次點關鍵字一律從卡片開始
  const setTab = (next: Tab) => setParams({ tab: next === "quotes" ? null : next, view: null });
  // 換頁與換看法要同一次寫進網址，分兩次呼叫後面那次會蓋掉前面那次
  const openKeywordView = (next: KeywordView) => setParams({ tab: "keywords", view: next });

  return (
    <>
      <PageHeader
        title="片段"
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
            ) : (
              <Quotes books={books} />
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
