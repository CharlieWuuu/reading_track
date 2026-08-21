"use client";

import { Suspense } from "react";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { TabBar } from "@/components/ui/controls";
import { BooksGate } from "@/features/books/components/books-gate";
import {
  KEYWORD_VIEWS,
  KeywordsSection,
  type KeywordView,
} from "@/features/keywords/components/keywords-section";
import { QuotesSection } from "@/features/notes/components/quotes-section";
import { VocabularySection } from "@/features/notes/components/vocabulary-section";
import { useUrlParams } from "@/hooks/use-url-param";

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
              <QuotesSection books={books} />
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
