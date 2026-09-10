"use client";

import { SelectMenu } from "@/components/ui/controls";
import { useBooks } from "@/hooks/use-books";
import { useRecords } from "@/hooks/use-records";
import { useUrlParams } from "@/hooks/use-url-param";
import { getQuoteRecords, quoteLanguages } from "@/utils/stats/vocabulary-stats";

/**
 * 佳句的語言篩選。用跟單字、書寫同一顆篩選鍵。
 *
 * 佳句沒有自己的語言欄，跟著出處書走（見 getQuoteRecords）——
 * 所以選項要從算好的 records 取，不能直接讀紀錄表。
 */
export function QuoteLanguageMenu() {
  const { books } = useBooks();
  const { quotes } = useRecords();
  const { searchParams, setParams } = useUrlParams();
  const language = searchParams.get("lang") ?? "";

  const options = quoteLanguages(getQuoteRecords(quotes, books));
  if (options.length < 2) return null;

  const items = [{ key: "", label: "全部" }, ...options.map((key) => ({ key, label: key }))];

  return (
    <SelectMenu
      bare
      items={items}
      value={language}
      label="語言"
      onChange={(next) => setParams({ lang: next || null })}
    />
  );
}
