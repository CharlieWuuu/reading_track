"use client";

import { FilterMenu } from "@/components/ui/filter-menu";
import { useBooks } from "@/hooks/use-books";
import { useRecords } from "@/hooks/use-records";
import { useUrlParams } from "@/hooks/use-url-param";
import { getVocabularyEntries, vocabularyLanguages } from "@/utils/vocabulary-stats";

/**
 * 單字的語言篩選。用跟書單、書寫同一顆篩選鍵。
 *
 * 語言以紀錄那一欄為準，沒填就跟著書走（見 getVocabularyEntries）——
 * 所以選項要從算好的 entries 取，不能直接讀紀錄表。
 */
export function VocabularyLanguageMenu() {
  const { books } = useBooks();
  const { vocabulary } = useRecords();
  const { searchParams, setParams } = useUrlParams();
  const language = searchParams.get("lang") ?? "";

  const options = vocabularyLanguages(getVocabularyEntries(vocabulary, books));
  if (options.length < 2) return null;

  return (
    <FilterMenu
      groups={[{ key: "lang", label: "語言", options, value: language }]}
      onChange={(_key, next) => setParams({ lang: next || null })}
    />
  );
}
