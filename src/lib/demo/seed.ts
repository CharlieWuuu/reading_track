import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { seedKinds } from "@/lib/db/mutations/kinds";
import { fragments } from "@/lib/db/schema/fragments";
import { internalLinks } from "@/lib/db/schema/internal-links";
import { kinds } from "@/lib/db/schema/kinds";
import { attributes, recordTopics } from "@/lib/db/schema/taxonomy";
import { users } from "@/lib/db/schema/users";
import { records, works } from "@/lib/db/schema/works";
import { writings } from "@/lib/db/schema/writings";
import { joinParagraphs } from "@/utils/paragraphs";
import { ATTRIBUTES, BOOKS, NOTES, QUOTES, TYPES, VOCABULARY, WRITINGS } from "./seed-data";

/**
 * demo 帳號的假資料。書名作者是真的，日期、心得、關鍵字都是編的。
 *
 * 先清掉那個帳號名下的所有資料再重灌——跑幾次結果都一樣，
 * 所以定時重置直接呼叫這一支就好。
 */

function daysAgo(n: number): string {
  const d = new Date(Date.now() - n * 86400000);
  return d.toISOString().slice(0, 10);
}

export async function seedDemo(email: string): Promise<string> {
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (!user) throw new Error(`找不到 ${email}，先用 scripts/create-user.ts 建帳號`);
  const userId = user.id;

  // 重跑要一致，先清掉這個帳號名下的東西（外鍵 cascade 會帶走關聯與子表）
  for (const table of [
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

  const typeId = new Map<string, string>();
  for (const [parent, children] of Object.entries(TYPES)) {
    const [row] = await db
      .insert(recordTopics)
      .values({ userId, name: parent })
      .returning({ id: recordTopics.id });
    typeId.set(parent, row.id);
    for (const child of children) {
      const [c] = await db
        .insert(recordTopics)
        .values({ userId, name: child, parentId: row.id })
        .returning({ id: recordTopics.id });
      typeId.set(`${parent}/${child}`, c.id);
    }
  }

  const attributeId = new Map<string, string>();
  for (const name of ATTRIBUTES) {
    const [row] = await db
      .insert(attributes)
      .values({ userId, name })
      .returning({ id: attributes.id });
    attributeId.set(name, row.id);
  }

  const allKeywords = new Set(BOOKS.flatMap((b) => b[6] as readonly string[]));
  for (const w of WRITINGS) for (const k of w[4] as readonly string[]) allKeywords.add(k);
  const keywordFragmentId = new Map<string, string>();
  if (allKeywords.size) {
    const rows = await db
      .insert(fragments)
      .values([...allKeywords].map((name) => ({ userId, kindId: keywordKindId, title: name })))
      .returning({ id: fragments.id, title: fragments.title });
    for (const row of rows) keywordFragmentId.set(row.title, row.id);
  }

  const bookIds: string[] = [];
  const readingIds: string[] = [];

  for (const [i, entry] of BOOKS.entries()) {
    const [title, author, publisher, domain, subDomain, attribute, names] = entry;
    const [book] = await db
      .insert(works)
      .values({
        userId,
        kindId: bookKindId,
        title,
        creator: author,
        language: "中文",
        publisher,
        topicId: typeId.get(subDomain ? `${domain}/${subDomain}` : domain) ?? null,
        attributeId: attributeId.get(attribute) ?? null,
        amount: 200 + ((i * 37) % 300),
      })
      .returning({ id: works.id });
    bookIds.push(book.id);

    // 前面幾本讀完、中間在讀、最後幾本想讀
    const status = i < 17 ? "完成" : i < 22 ? "進行" : "想要";
    const [reading] = await db
      .insert(records)
      .values({
        userId,
        workId: book.id,
        startDate: status === "想要" ? null : daysAgo(400 - i * 12),
        endDate: status === "完成" ? daysAgo(380 - i * 12) : null,
      })
      .returning({ id: records.id });
    readingIds.push(reading.id);

    if (names.length)
      await db.insert(internalLinks).values(
        names.map((name) => ({
          userId,
          aId: book.id,
          bId: keywordFragmentId.get(name)!,
        })),
      );
  }

  // 兩本重讀：同一個作品底下再加一次紀錄
  for (const i of [13, 19]) {
    await db.insert(records).values({
      userId,
      workId: bookIds[i],
      startDate: daysAgo(90),
      endDate: daysAgo(60),
    });
  }

  // 「書寫」是 group 不是 kind——每則自己帶著類型（第 4 欄），照它走
  const writingKindIds = new Map(
    await Promise.all(
      [...new Set(WRITINGS.map((w) => w[3]))].map(
        async (name) => [name, await kindId(name)] as const,
      ),
    ),
  );

  for (const [i, entry] of WRITINGS.entries()) {
    const [title, , bookIndex, kindName, names] = entry;
    const [writing] = await db
      .insert(writings)
      .values({
        userId,
        kindId: writingKindIds.get(kindName)!,
        title,
        body: NOTES[title] ?? "",
        endDate: daysAgo(300 - i * 25),
      })
      .returning({ id: writings.id });

    // 出處跟關鍵字同一張表：這則延伸自哪本書也是一條站內關聯
    if (bookIndex !== null)
      await db.insert(internalLinks).values({ userId, aId: writing.id, bId: bookIds[bookIndex] });

    if (names.length)
      await db.insert(internalLinks).values(
        names.map((name) => ({
          userId,
          aId: writing.id,
          bId: keywordFragmentId.get(name)!,
        })),
      );
  }

  const quoteFragments = QUOTES.map(([bookIndex, text, chapter]) => ({
    row: { id: crypto.randomUUID(), userId, kindId: quoteKindId, title: text, locator: chapter },
    workId: bookIds[bookIndex],
  }));
  await db.insert(fragments).values(quoteFragments.map(({ row }) => row));
  await db
    .insert(internalLinks)
    .values(quoteFragments.map(({ row, workId }) => ({ userId, aId: row.id, bId: workId })));

  const vocabularyFragments = VOCABULARY.map(
    ([bookIndex, word, pronunciation, wordTranslation, example, exampleTranslation]) => ({
      row: {
        id: crypto.randomUUID(),
        userId,
        kindId: vocabularyKindId,
        title: word,
        pronunciation,
        translation: wordTranslation,
        body: joinParagraphs([example, exampleTranslation]),
      },
      workId: bookIds[bookIndex],
    }),
  );
  await db.insert(fragments).values(vocabularyFragments.map(({ row }) => row));
  await db
    .insert(internalLinks)
    .values(vocabularyFragments.map(({ row, workId }) => ({ userId, aId: row.id, bId: workId })));

  return (
    `${email}：${BOOKS.length} 本書、${readingIds.length + 2} 次閱讀、${WRITINGS.length} 則書寫、` +
    `${QUOTES.length} 句佳句、${VOCABULARY.length} 個單字、${allKeywords.size} 個關鍵字`
  );
}
