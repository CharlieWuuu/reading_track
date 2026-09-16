"use client";

import { useMemo } from "react";
import { DataGate } from "@/components/layout/data-gate";
import { SectionList } from "@/features/stats/components/section-list";
import { useModuleSections } from "@/features/stats/hooks/use-module-sections";
import { useArticles } from "@/hooks/use-articles";

/**
 * 文章的統計。圖表由勾了哪些模組決定，不寫死在這裡。
 *
 * 模組清單跟 kind-templates 的 articles 一致；Article 那個型別是舊形狀
 * （author／type），所以這裡轉成欄位庫的名字再交出去。
 */
const ARTICLE_MODULES = [
  "title",
  "creator",
  "endDate",
  "platform",
  "language",
  "topic",
  "attribute",
] as const;

// 字數不列：Article 沒帶那一欄，勾了只會顯示「總字數 0」
const LABELS = { creator: "作者", platform: "媒體" };

export function ArticlesStats() {
  const { articles, isLoading, error } = useArticles();

  const rows = useMemo(
    () =>
      articles.map((article) => ({
        endDate: article.endDate,
        creator: article.author,
        platform: article.platform,
        language: article.language,
        domain: article.domain,
        subDomain: article.subDomain,
        attribute: article.type,
      })),
    [articles],
  );

  const sections = useModuleSections({
    moduleKeys: ARTICLE_MODULES,
    labels: LABELS,
    rows,
    unit: "篇",
  });

  return (
    <DataGate
      isLoading={isLoading}
      error={error}
      isEmpty={articles.length === 0}
      emptyText="尚無文章"
    >
      <SectionList sections={sections} />
    </DataGate>
  );
}
