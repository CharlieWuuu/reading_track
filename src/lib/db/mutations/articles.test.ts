import { and, eq, or } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import { fragments } from "@/lib/db/schema/fragments";
import { internalLinks } from "@/lib/db/schema/internal-links";
import { records } from "@/lib/db/schema/works";
import { seedUser } from "@/lib/db/test/factories";
import type { Article } from "@/types/article";

vi.mock("@/lib/db/client", async () => {
  const { makeTestDb } = await import("@/lib/db/test/pglite");
  return { db: await makeTestDb() };
});

const { addArticleRow, updateArticleRow, deleteArticleRow } = await import("./articles");
const { db } = await import("@/lib/db/client");
const userId = await seedUser(db);

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

async function linkedKeywordNames(ownerId: string): Promise<string[]> {
  const links = await db
    .select()
    .from(internalLinks)
    .where(
      and(
        eq(internalLinks.userId, userId),
        or(eq(internalLinks.aId, ownerId), eq(internalLinks.bId, ownerId)),
      ),
    );
  const otherIds = links.map((l) => (l.aId === ownerId ? l.bId : l.aId));
  if (!otherIds.length) return [];

  const rows = await db.select().from(fragments).where(eq(fragments.userId, userId));
  return rows
    .filter((f) => otherIds.includes(f.id))
    .map((f) => f.name)
    .sort();
}

describe("addArticleRow", () => {
  it("沒填日期存得進去", async () => {
    const article = makeArticle({ endDate: "" });
    await addArticleRow(userId, article);

    const [row] = await db.select().from(records).where(eq(records.id, article.id));
    expect(row.endDate).toBeNull();
  });

  it("關鍵字自動變成片段並連結起來", async () => {
    const article = makeArticle({ keywords: "馬克思\n資本論" });
    await addArticleRow(userId, article);

    expect(await linkedKeywordNames(article.id)).toEqual(["馬克思", "資本論"].sort());
  });
});

describe("updateArticleRow", () => {
  it("換一組關鍵字，舊的連結要清掉", async () => {
    const article = makeArticle({ keywords: "舊字" });
    await addArticleRow(userId, article);

    await updateArticleRow(userId, article.id, { keywords: "新字" });

    expect(await linkedKeywordNames(article.id)).toEqual(["新字"]);
  });

  it("日期清空存回 null", async () => {
    const article = makeArticle({ endDate: "2026-02-02" });
    await addArticleRow(userId, article);

    await updateArticleRow(userId, article.id, { endDate: "" });

    const [row] = await db.select().from(records).where(eq(records.id, article.id));
    expect(row.endDate).toBeNull();
  });
});

describe("deleteArticleRow", () => {
  it("刪掉文章，連結一起清掉", async () => {
    const article = makeArticle({ keywords: "會被連帶刪掉的字" });
    await addArticleRow(userId, article);

    await deleteArticleRow(userId, article.id);

    expect(await db.select().from(records).where(eq(records.id, article.id))).toHaveLength(0);
    expect(await linkedKeywordNames(article.id)).toHaveLength(0);
  });
});
