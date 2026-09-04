import { eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import { articleKeywords } from "@/lib/db/schema/keyword-links";
import { articles } from "@/lib/db/schema/reading";
import { keywords } from "@/lib/db/schema/taxonomy";
import type { Article } from "@/types/article";

vi.mock("@/lib/db/client", async () => {
  const { makeTestDb } = await import("@/lib/db/test/pglite");
  return { db: await makeTestDb() };
});

const { addArticleRow, updateArticleRow, deleteArticleRow } = await import("./articles");
const { db } = await import("@/lib/db/client");

function makeArticle(patch: Partial<Article> = {}): Article {
  return {
    id: crypto.randomUUID(),
    title: "一篇文章",
    author: "",
    platform: "",
    sourceUrl: "",
    endDate: "",
    language: "",
    domain: "",
    subDomain: "",
    type: "",
    keywords: "",
    private: "",
    ...patch,
  } as Article;
}

describe("addArticleRow", () => {
  it("沒填日期存得進去", async () => {
    const article = makeArticle({ endDate: "" });
    await addArticleRow(article);

    const [row] = await db.select().from(articles).where(eq(articles.id, article.id));
    expect(row.endDate).toBeNull();
  });

  it("關鍵字同時進主檔與關聯表", async () => {
    const article = makeArticle({ keywords: "馬克思\n資本論" });
    await addArticleRow(article);

    const linked = await db
      .select()
      .from(articleKeywords)
      .where(eq(articleKeywords.articleId, article.id));
    expect(linked.map((r) => r.keyword).sort()).toEqual(["資本論", "馬克思"].sort());

    const master = await db.select().from(keywords).where(eq(keywords.name, "馬克思"));
    expect(master).toHaveLength(1);
  });
});

describe("updateArticleRow", () => {
  it("換一組關鍵字，舊的關聯要清掉", async () => {
    const article = makeArticle({ keywords: "舊字" });
    await addArticleRow(article);

    await updateArticleRow(article.id, { keywords: "新字" });

    const linked = await db
      .select()
      .from(articleKeywords)
      .where(eq(articleKeywords.articleId, article.id));
    expect(linked.map((r) => r.keyword)).toEqual(["新字"]);
  });

  it("日期清空存回 null", async () => {
    const article = makeArticle({ endDate: "2026-02-02" });
    await addArticleRow(article);

    await updateArticleRow(article.id, { endDate: "" });

    const [row] = await db.select().from(articles).where(eq(articles.id, article.id));
    expect(row.endDate).toBeNull();
  });
});

describe("deleteArticleRow", () => {
  it("刪掉文章，關聯靠 cascade 一起走", async () => {
    const article = makeArticle({ keywords: "會被連帶刪掉的字" });
    await addArticleRow(article);

    await deleteArticleRow(article.id);

    expect(await db.select().from(articles).where(eq(articles.id, article.id))).toHaveLength(0);
    expect(
      await db.select().from(articleKeywords).where(eq(articleKeywords.articleId, article.id)),
    ).toHaveLength(0);
  });
});
