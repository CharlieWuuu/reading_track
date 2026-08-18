"use client";

import { useParams, useRouter } from "next/navigation";
import { KeywordForm } from "@/components/keywords/KeywordForm";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageMessage } from "@/components/layout/PageMessage";
import { useKeywordInfos } from "@/lib/useKeywordInfos";
import { EMPTY_KEYWORD_INFO } from "@/types/keyword";

/**
 * 一個關鍵字自己的編輯頁。
 *
 * 名字就是網址上的那一段——關鍵字沒有編號，主檔本來就是靠名字認人的。
 * 主檔裡還沒有這一列也照樣打得開：那代表這個字只出現在某本書的關鍵字欄，
 * 存下去就會補上主檔那一列。
 */
export default function EditKeywordPage() {
  const router = useRouter();
  const { name } = useParams<{ name: string }>();
  const keyword = decodeURIComponent(name);
  const { byName, save, remove, isLoading, error } = useKeywordInfos();

  const info = byName.get(keyword) ?? { name: keyword, ...EMPTY_KEYWORD_INFO };

  return (
    <>
      <PageHeader title="編輯關鍵字" backHref="/keywords" />
      <PageBody>
        {isLoading ? (
          <PageMessage>載入中…</PageMessage>
        ) : error ? (
          <PageMessage tone="error">{error}</PageMessage>
        ) : (
          <KeywordForm info={info} onSave={save} onDelete={remove} onDone={() => router.back()} />
        )}
      </PageBody>
    </>
  );
}
