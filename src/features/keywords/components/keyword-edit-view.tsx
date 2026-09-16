"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { RecordGate } from "@/components/layout/record-gate";
import { kindHref } from "@/config/kind-routes";
import { keywordHref } from "@/config/routes";
import { useKeywordInfos } from "@/features/keywords/api/use-keyword-infos";
import { KeywordForm } from "@/features/keywords/components/keyword-form";
import { EMPTY_KEYWORD_INFO } from "@/types/keyword";

/**
 * 一個關鍵字自己的編輯頁。
 *
 * 名字就是網址上的那一段——關鍵字沒有編號，主檔本來就靠名字認人，所以通用
 * 編輯頁接不住它。主檔裡還沒有這一列也照樣打得開：那代表這個字只出現在
 * 某本書的關鍵字欄，存下去就會補上主檔那一列。
 */
function KeywordEdit({ recordId }: { recordId: string }) {
  const router = useRouter();
  const keyword = decodeURIComponent(recordId);
  // 從哪裡點進來就回哪裡：分頁與看法都在那串參數裡
  const from = useSearchParams().get("from") || keywordHref(keyword);
  const { byName, save, remove, isLoading, error } = useKeywordInfos();

  const info = byName.get(keyword) ?? { name: keyword, createdAt: "", ...EMPTY_KEYWORD_INFO };

  return (
    <>
      <PageHeader
        title="編輯"
        size="compact"
        parent={[
          { label: "片段", href: "/fragments" },
          { label: "關鍵字", href: kindHref("fragments", "keywords") },
          { label: keyword, href: keywordHref(keyword) },
        ]}
        backHref={from}
      />
      <PageBody>
        <RecordGate loading={isLoading} error={error}>
          <KeywordForm
            info={info}
            onSave={save}
            onDelete={remove}
            onDone={() => router.push(from)}
          />
        </RecordGate>
      </PageBody>
    </>
  );
}

/** 讀網址參數的元件要有 Suspense 邊界，靜態預先產生才不會失敗 */
export function KeywordEditView({ recordId }: { recordId: string }) {
  return (
    <Suspense fallback={null}>
      <KeywordEdit recordId={recordId} />
    </Suspense>
  );
}
