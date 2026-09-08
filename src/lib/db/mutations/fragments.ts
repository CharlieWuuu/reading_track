import { and, eq } from "drizzle-orm";
import { db, type Tx } from "@/lib/db/client";
import { fragments } from "@/lib/db/schema/fragments";
import { mapBookKeyword } from "@/lib/db/schema/keyword-links";
import { keywords } from "@/lib/db/schema/taxonomy";
import { records } from "@/lib/db/schema/works";
import { KeywordInfo } from "@/types/keyword";
import { QuoteRow, VocabularyRow } from "@/types/record";
import { setFragmentSourceUrl } from "./external-links";
import { kindIdByName } from "./kind-lookup";

/**
 * 佳句、單字、關鍵字的寫入。三種都在 fragments 表裡，靠類型分。
 *
 * 畫面送進來的 bookId 是「某一次讀」的編號，資料庫記的是「哪個作品」——
 * 換算在這一層做完，呼叫端不用知道有這回事。
 *
 * 關鍵字有兩個身分：片段（維基資料在 fragments）與關聯表的主檔（keywords 那張，
 * 三張 *_keywords 的外鍵指著它）。主檔因為外鍵拿不掉，所以只留名字，寫入時兩邊都維護。
 */

async function workIdOf(userId: string, readingId: string): Promise<string | null> {
  const id = readingId.trim();
  if (!id) return null;
  const [row] = await db
    .select({ workId: records.workId })
    .from(records)
    .where(and(eq(records.userId, userId), eq(records.id, id)));
  return row?.workId ?? null;
}

/** 某個作品底下某一種片段整批換掉：先刪屬於它的，再把新的加回去 */
async function replaceFragments(
  userId: string,
  workId: string,
  kindName: string,
  rows: (kindId: string) => Record<string, unknown>[],
): Promise<void> {
  await db.transaction(async (tx) => {
    const kindId = await kindIdByName(tx, userId, kindName);
    await tx
      .delete(fragments)
      .where(
        and(
          eq(fragments.userId, userId),
          eq(fragments.workId, workId),
          eq(fragments.kindId, kindId),
        ),
      );
    const values = rows(kindId);
    if (values.length) await tx.insert(fragments).values(values as never);
  });
}

export async function replaceBookQuotes(
  userId: string,
  readingId: string,
  items: QuoteRow[],
): Promise<void> {
  const workId = await workIdOf(userId, readingId);
  if (!workId) return;

  await replaceFragments(userId, workId, "佳句", (kindId) =>
    items
      .filter((item) => item.text.trim())
      .map((item) => ({
        id: item.id || crypto.randomUUID(),
        userId,
        kindId,
        workId,
        phrase: item.text,
        locator: item.chapter,
        note: item.note,
      })),
  );
}

export async function replaceBookVocabulary(
  userId: string,
  readingId: string,
  items: VocabularyRow[],
): Promise<void> {
  const workId = await workIdOf(userId, readingId);
  if (!workId) return;

  await replaceFragments(userId, workId, "單字", (kindId) =>
    items
      .filter((item) => item.word.trim())
      .map((item) => ({
        id: item.id || crypto.randomUUID(),
        userId,
        kindId,
        workId,
        name: item.word,
        pronunciation: item.pronunciation,
        translation: item.wordTranslation,
        context: item.sentence,
        contextTranslation: item.sentenceTranslation,
        locator: item.chapter,
      })),
  );
}

/**
 * 單列新增。整批取代是以「哪個作品」為單位的，沒有作品就沒有那個單位——
 * 抄到一句話不是從書上看到的，走這條進來，work_id 留空。
 *
 * 選了書但那個 readingId 查不到作品時視為無出處，不是丟錯：寧可留下這一筆。
 */
export async function addQuote(userId: string, readingId: string, item: QuoteRow): Promise<void> {
  if (!item.text.trim()) return;
  // 交易外先查好：在交易裡用外層的 db 會等自己解鎖
  const workId = await workIdOf(userId, readingId);

  await db.transaction(async (tx) => {
    await tx.insert(fragments).values({
      id: item.id || crypto.randomUUID(),
      userId,
      kindId: await kindIdByName(tx, userId, "佳句"),
      workId,
      phrase: item.text,
      locator: item.chapter,
      note: item.note,
    });
  });
}

export async function addVocabulary(
  userId: string,
  readingId: string,
  item: VocabularyRow,
): Promise<void> {
  if (!item.word.trim()) return;
  const workId = await workIdOf(userId, readingId);

  await db.transaction(async (tx) => {
    await tx.insert(fragments).values({
      id: item.id || crypto.randomUUID(),
      userId,
      kindId: await kindIdByName(tx, userId, "單字"),
      workId,
      name: item.word,
      pronunciation: item.pronunciation,
      translation: item.wordTranslation,
      context: item.sentence,
      contextTranslation: item.sentenceTranslation,
      locator: item.chapter,
    });
  });
}

/** 主檔只留名字，關聯表的外鍵靠它 */
async function ensureKeywordName(tx: Tx, userId: string, name: string): Promise<void> {
  await tx.insert(keywords).values({ userId, name }).onConflictDoNothing();
}

/** 維基查回來的資料整批寫入；已經有的就更新，不動使用者自己填的名字 */
export async function saveKeywordInfos(userId: string, infos: KeywordInfo[]): Promise<void> {
  await db.transaction(async (tx) => {
    const kindId = await kindIdByName(tx, userId, "關鍵字");

    for (const info of infos) {
      await ensureKeywordName(tx, userId, info.name);

      const values = {
        body: info.summary,
        topics: info.topics,
        coordinates: info.coordinates,
        span: info.span,
      };
      const [existing] = await tx
        .select({ id: fragments.id })
        .from(fragments)
        .where(
          and(
            eq(fragments.userId, userId),
            eq(fragments.kindId, kindId),
            eq(fragments.name, info.name),
          ),
        );

      const fragmentId = existing
        ? existing.id
        : (
            await tx
              .insert(fragments)
              .values({ userId, kindId, name: info.name, ...values })
              .returning({ id: fragments.id })
          )[0].id;
      if (existing) await tx.update(fragments).set(values).where(eq(fragments.id, fragmentId));

      await setFragmentSourceUrl(tx, userId, fragmentId, info.wikiUrl);
    }
  });
}

/** 使用者親手改的那一列，整列照寫——這裡不是自動補齊，不必保護既有值 */
export async function replaceKeywordInfo(userId: string, info: KeywordInfo): Promise<void> {
  await saveKeywordInfos(userId, [info]);
}

/**
 * 關鍵字改名。主檔的名字是主鍵、加了 on update cascade，所以三張關聯表自動跟著改；
 * 片段那一列要自己改，它的身分是編號不是名字。
 *
 * 改成一個已經存在的名字等於合併：先把兩邊都掛著的關聯拆掉，再讓資料庫去改名。
 * 回傳動到幾本書。
 */
export async function renameKeyword(userId: string, from: string, to: string): Promise<number> {
  if (!from || !to || from === to) return 0;

  const affected = await db
    .select({ bookId: mapBookKeyword.bookId })
    .from(mapBookKeyword)
    .where(and(eq(mapBookKeyword.userId, userId), eq(mapBookKeyword.keyword, from)));

  const [existing] = await db
    .select({ name: keywords.name })
    .from(keywords)
    .where(and(eq(keywords.userId, userId), eq(keywords.name, to)));

  await db.transaction(async (tx) => {
    const kindId = await kindIdByName(tx, userId, "關鍵字");

    if (existing) {
      // 合併：舊名字的關聯改指新名字，重複的丟掉，然後刪掉舊的主檔與片段
      const rows = affected.map((r) => ({ userId, bookId: r.bookId, keyword: to }));
      if (rows.length) await tx.insert(mapBookKeyword).values(rows).onConflictDoNothing();
      await tx.delete(keywords).where(and(eq(keywords.userId, userId), eq(keywords.name, from)));
      const [old] = await tx
        .select({ id: fragments.id })
        .from(fragments)
        .where(
          and(eq(fragments.userId, userId), eq(fragments.kindId, kindId), eq(fragments.name, from)),
        );
      await tx
        .delete(fragments)
        .where(
          and(eq(fragments.userId, userId), eq(fragments.kindId, kindId), eq(fragments.name, from)),
        );
      // external_links 的 source_id 不是外鍵（要同時指兩張表），fragment 刪掉不會自動 cascade
      if (old) await setFragmentSourceUrl(tx, userId, old.id, "");
    } else {
      await tx
        .update(keywords)
        .set({ name: to })
        .where(and(eq(keywords.userId, userId), eq(keywords.name, from)));
      await tx
        .update(fragments)
        .set({ name: to })
        .where(
          and(eq(fragments.userId, userId), eq(fragments.kindId, kindId), eq(fragments.name, from)),
        );
    }
  });

  return affected.length;
}

/** 刪掉主檔那一列，關聯表靠 on delete cascade 一起清掉。回傳動到幾本書 */
export async function deleteKeyword(userId: string, name: string): Promise<number> {
  const affected = await db
    .select({ bookId: mapBookKeyword.bookId })
    .from(mapBookKeyword)
    .where(and(eq(mapBookKeyword.userId, userId), eq(mapBookKeyword.keyword, name)));

  await db.transaction(async (tx) => {
    const kindId = await kindIdByName(tx, userId, "關鍵字");
    await tx.delete(keywords).where(and(eq(keywords.userId, userId), eq(keywords.name, name)));
    const [old] = await tx
      .select({ id: fragments.id })
      .from(fragments)
      .where(
        and(eq(fragments.userId, userId), eq(fragments.kindId, kindId), eq(fragments.name, name)),
      );
    await tx
      .delete(fragments)
      .where(
        and(eq(fragments.userId, userId), eq(fragments.kindId, kindId), eq(fragments.name, name)),
      );
    if (old) await setFragmentSourceUrl(tx, userId, old.id, "");
  });

  return affected.length;
}
