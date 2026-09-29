import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { seedKinds } from "@/lib/db/mutations/kinds";
import { externalLinks } from "@/lib/db/schema/external-links";
import { fragments } from "@/lib/db/schema/fragments";
import { internalLinks } from "@/lib/db/schema/internal-links";
import { kinds } from "@/lib/db/schema/kinds";
import { attributes, recordTopics } from "@/lib/db/schema/taxonomy";
import { users } from "@/lib/db/schema/users";
import { records, works } from "@/lib/db/schema/works";
import { writings } from "@/lib/db/schema/writings";
import { joinParagraphs } from "@/utils/paragraphs";
import { ATTRIBUTES, BOOKS, QUOTES, REREADS, TYPES, VOCABULARY, WRITINGS } from "./seed-data";
import { KEYWORDS, wikiUrl } from "./seed-keywords";

// demo 帳號的資料。書目、關鍵字、維基連結是真的；日期、書寫是編的
// 先清掉那個帳號名下的所有資料再重灌——跑幾次結果都一樣，定時重置直接呼叫這一支

function daysAgo(n: number): string {
  const d = new Date(Date.now() - n * 86400000);
  return d.toISOString().slice(0, 10);
}

const lookup = (map: Map<string, string>, key: string, what: string) => {
  const id = map.get(key);
  if (!id) throw new Error(`demo 資料對不上：找不到${what}「${key}」`);
  return id;
};

export async function seedDemo(email: string): Promise<string> {
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (!user) throw new Error(`找不到 ${email}，先用 scripts/create-user.ts 建帳號`);
  const userId = user.id;

  // 重跑要一致，先清掉這個帳號名下的東西（外鍵 cascade 會帶走關聯與子表）
  for (const table of [
    externalLinks,
    internalLinks,
    fragments,
    writings,
    works,
    recordTopics,
    attributes,
    kinds,
  ]) {
    await db.delete(table).where(eq(table.userId, userId));
  }
  await seedKinds(userId); // 類型是資料，demo 帳號也要有

  // 類型定義一人一份，demo 帳號也是自己那幾列
  const kindId = async (name: string) => {
    const rows = await db
      .select({ id: kinds.id })
      .from(kinds)
      .where(and(eq(kinds.userId, userId), eq(kinds.name, name)));
    if (!rows.length) throw new Error(`找不到類型「${name}」，seedKinds 沒建起來`);
    return rows[0].id;
  };

  const bookKindId = await kindId("書籍");
  const quoteKindId = await kindId("佳句");
  const vocabularyKindId = await kindId("單字");
  const keywordKindId = await kindId("關鍵字");

  const typeIds = new Map<string, string>();
  for (const [parent, children] of Object.entries(TYPES)) {
    const [row] = await db
      .insert(recordTopics)
      .values({ userId, name: parent })
      .returning({ id: recordTopics.id });
    typeIds.set(parent, row.id);
    for (const child of children) {
      const [c] = await db
        .insert(recordTopics)
        .values({ userId, name: child, parentId: row.id })
        .returning({ id: recordTopics.id });
      typeIds.set(`${parent}/${child}`, c.id);
    }
  }
  const topicId = (topic: string) => lookup(typeIds, topic, "領域");

  const attributeIds = new Map<string, string>();
  for (const name of ATTRIBUTES) {
    const [row] = await db
      .insert(attributes)
      .values({ userId, name })
      .returning({ id: attributes.id });
    attributeIds.set(name, row.id);
  }

  // 關鍵字先建，書與書寫才連得過去
  const keywordRows = KEYWORDS.map((k) => ({
    id: crypto.randomUUID(),
    userId,
    kindId: keywordKindId,
    title: k.title,
    body: k.body,
    topicId: topicId(k.topic),
    startYear: k.startYear ?? null,
    endYear: k.endYear ?? null,
    latitude: k.lat ?? null,
    longitude: k.lng ?? null,
  }));
  await db.insert(fragments).values(keywordRows);
  const keywordIds = new Map(keywordRows.map((r) => [r.title, r.id]));
  const keywordId = (name: string) => lookup(keywordIds, name, "關鍵字");

  const wikiLinks = KEYWORDS.flatMap((k, i) =>
    k.wiki
      ? [{ userId, fragmentId: keywordRows[i].id, url: wikiUrl(k.wiki), label: "維基百科" }]
      : [],
  );
  if (wikiLinks.length) await db.insert(externalLinks).values(wikiLinks);

  const bookRows = BOOKS.map((b) => ({
    id: crypto.randomUUID(),
    userId,
    kindId: bookKindId,
    title: b.title,
    body: b.body,
    creator: b.creator,
    language: "中文",
    publisher: b.publisher,
    topicId: topicId(b.topic),
    attributeId: lookup(attributeIds, b.attribute, "屬性"),
    amount: b.amount,
    coverUrl: b.coverUrl,
    externalId: b.externalId,
  }));
  await db.insert(works).values(bookRows);
  const bookIds = bookRows.map((r) => r.id);

  // 狀態從日期推：想要兩個都空、進行只有開始、完成兩個都有
  const readingRows = BOOKS.map((b, i) => ({
    userId,
    workId: bookIds[i],
    startDate: b.status === "想要" ? null : daysAgo(b.status === "進行" ? 20 + i : 420 - i * 13),
    endDate: b.status === "完成" ? daysAgo(400 - i * 13) : null,
  }));
  // 重讀：同一個作品底下再加一次紀錄
  const rereadRows = REREADS.map((i) => ({
    userId,
    workId: bookIds[i],
    startDate: daysAgo(90),
    endDate: daysAgo(60),
  }));
  await db.insert(records).values([...readingRows, ...rereadRows]);

  await db
    .insert(internalLinks)
    .values(
      BOOKS.flatMap((b, i) =>
        b.keywords.map((name) => ({ userId, aId: bookIds[i], bId: keywordId(name) })),
      ),
    );

  // 「書寫」是 group 不是 kind——每則自己帶著類型，照它走
  const writingKindIds = new Map(
    await Promise.all(
      [...new Set(WRITINGS.map((w) => w.kind))].map(
        async (name) => [name, await kindId(name)] as const,
      ),
    ),
  );
  const writingRows = WRITINGS.map((w, i) => ({
    id: crypto.randomUUID(),
    userId,
    kindId: lookup(writingKindIds, w.kind, "類型"),
    title: w.title,
    body: w.body,
    topicId: topicId(w.topic),
    endDate: daysAgo(300 - i * 25),
  }));
  await db.insert(writings).values(writingRows);

  // 出處跟關鍵字同一張表：這則延伸自哪本書也是一條站內關聯
  await db
    .insert(internalLinks)
    .values(
      WRITINGS.flatMap((w, i) => [
        ...(w.book === null ? [] : [{ userId, aId: writingRows[i].id, bId: bookIds[w.book] }]),
        ...w.keywords.map((name) => ({ userId, aId: writingRows[i].id, bId: keywordId(name) })),
      ]),
    );

  const quoteRows = QUOTES.map((q) => ({
    id: crypto.randomUUID(),
    userId,
    kindId: quoteKindId,
    title: q.text,
    locator: q.locator,
    creator: BOOKS[q.book].creator,
    topicId: topicId(BOOKS[q.book].topic),
  }));
  const vocabularyRows = VOCABULARY.map((v) => ({
    id: crypto.randomUUID(),
    userId,
    kindId: vocabularyKindId,
    title: v.word,
    pronunciation: v.pronunciation,
    translation: v.translation,
    body: joinParagraphs([v.example, v.exampleTranslation]),
    language: "英文",
    topicId: topicId(BOOKS[v.book].topic),
  }));
  await db.insert(fragments).values([...quoteRows, ...vocabularyRows]);
  await db
    .insert(internalLinks)
    .values([
      ...quoteRows.map((r, i) => ({ userId, aId: r.id, bId: bookIds[QUOTES[i].book] })),
      ...vocabularyRows.map((r, i) => ({ userId, aId: r.id, bId: bookIds[VOCABULARY[i].book] })),
    ]);

  return (
    `${email}：${BOOKS.length} 本書、${readingRows.length + rereadRows.length} 次閱讀、` +
    `${WRITINGS.length} 則書寫、${QUOTES.length} 句佳句、${VOCABULARY.length} 個單字、` +
    `${KEYWORDS.length} 個關鍵字、${wikiLinks.length} 個維基連結`
  );
}
