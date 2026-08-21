import { afterEach, describe, expect, it, vi } from "vitest";
import { makeArticle, resetIds } from "@/testing/factories";
import {
  getArticleDomainDistribution,
  getArticleKpis,
  getArticleMonthlyTrend,
  getArticleTypeDistribution,
  getSourceRanking,
} from "./article-stats";

resetIds();

function freeze(local: string) {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(local));
}

afterEach(() => {
  vi.useRealTimers();
});

describe("getArticleKpis", () => {
  it("閱讀日期就是統計看的日期", () => {
    freeze("2026-08-19T10:00:00");

    const kpis = getArticleKpis([
      makeArticle({ endDate: "2026-03-01" }),
      makeArticle({ endDate: "" }),
    ]);

    expect(kpis).toMatchObject({ completed: 1, thisYear: 1 });
  });
});

describe("getArticleMonthlyTrend", () => {
  it("依閱讀日期落到月份上", () => {
    freeze("2026-08-19T10:00:00");

    expect(getArticleMonthlyTrend([makeArticle({ endDate: "2026-08-05" })], 1)).toEqual([
      { month: "2026-08", count: 1 },
    ]);
  });
});

describe("getSourceRanking", () => {
  it("依站台排行", () => {
    freeze("2026-08-19T10:00:00");
    const articles = [
      makeArticle({ platform: "報導者" }),
      makeArticle({ platform: "報導者" }),
      makeArticle({ platform: "端傳媒" }),
    ];

    expect(getSourceRanking(articles)).toEqual([
      { name: "報導者", value: 2 },
      { name: "端傳媒", value: 1 },
    ]);
  });

  it("沒填站台的不上榜，也不會多一個未分類", () => {
    expect(getSourceRanking([makeArticle({ platform: "" })])).toEqual([]);
  });

  it("limit 截斷", () => {
    const articles = [
      makeArticle({ platform: "a" }),
      makeArticle({ platform: "a" }),
      makeArticle({ platform: "b" }),
    ];

    expect(getSourceRanking(articles, 1)).toEqual([{ name: "a", value: 2 }]);
  });
});

describe("getArticleDomainDistribution", () => {
  it("一格多個領域各算一次", () => {
    expect(getArticleDomainDistribution([makeArticle({ domain: "社會、政治" })])).toEqual([
      { name: "社會", value: 1 },
      { name: "政治", value: 1 },
    ]);
  });

  it("沒填領域的算未分類", () => {
    expect(getArticleDomainDistribution([makeArticle({ domain: "" })])).toEqual([
      { name: "未分類", value: 1 },
    ]);
  });
});

describe("getArticleTypeDistribution", () => {
  it("依屬性分布", () => {
    expect(getArticleTypeDistribution([makeArticle({ type: "閒書" })])).toEqual([
      { name: "閒書", value: 1 },
    ]);
  });
});
