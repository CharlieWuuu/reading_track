import { and, eq } from "drizzle-orm";
import { db, type Tx } from "@/lib/db/client";
import { linkedIdsOf } from "@/lib/db/queries/internal-links";
import { fragments } from "@/lib/db/schema/fragments";
import { records } from "@/lib/db/schema/works";
import { KeywordInfo } from "@/types/keyword";
import { QuoteRow, VocabularyRow } from "@/types/record";
import { setFragmentSourceUrl } from "./external-links";
import { link, setLinks, unlinkAll } from "./internal-links";
import { kindIdByName } from "./kind-lookup";

/**
 * 佳句、單字、關鍵字的寫入。三種都在 fragments 表裡，靠類型分。
 *
 * 畫面送進來的 bookId 是「某一次讀」的編號，資料庫記的是「哪個作品」——
 * 換算在這一層做完，呼叫端不用知道有這回事。
 *
 * 關鍵字就是一則 fragment（kind 是「關鍵字」），沒有另外的主檔。
 * 誰連到哪個關鍵字走 internal_links，不分書／文章／書寫。
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
        body: item.note,
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
      body: item.note,
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

/** 關鍵字片段，查不到就自己長一個出來——名字是唯一的身分 */
export async function keywordFragmentId(tx: Tx, userId: string, name: string): Promise<string> {
  const kindId = await kindIdByName(tx, userId, "關鍵字");
  const [existing] = await tx
    .select({ id: fragments.id })
    .from(fragments)
    .where(
      and(eq(fragments.userId, userId), eq(fragments.kindId, kindId), eq(fragments.name, name)),
    );
  if (existing) return existing.id;

  const [row] = await tx
    .insert(fragments)
    .values({ userId, kindId, name })
    .returning({ id: fragments.id });
  return row.id;
}

/**
 * 某一筆資料（書、文章、書寫……）身上的關鍵字整批換掉。
 * 名字自動變成關鍵字片段（沒有就新建），再用 internal_links 連起來。
 */
export async function setKeywordLinks(
  tx: Tx,
  userId: string,
  ownerId: string,
  names: string[],
): Promise<void> {
  const ids = await Promise.all(names.map((name) => keywordFragmentId(tx, userId, name)));
  await setLinks(tx, userId, ownerId, ids);
}

/** 維基查回來的資料整批寫入；已經有的就更新，不動使用者自己填的名字 */
export async function saveKeywordInfos(userId: string, infos: KeywordInfo[]): Promise<void> {
  await db.transaction(async (tx) => {
    const kindId = await kindIdByName(tx, userId, "關鍵字");

    for (const info of infos) {
      const values = {
        body: info.summary,
        tags: info.tags,
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
 * 關鍵字改名。片段的名字就是身分，改名字＝改那一列的 name。
 *
 * 改成一個已經存在的名字等於合併：新名字那則留著，舊名字那則的連結轉過去，
 * 舊的片段刪掉。回傳動到幾條連結。
 */
export async function renameKeyword(userId: string, from: string, to: string): Promise<number> {
  if (!from || !to || from === to) return 0;

  return db.transaction(async (tx) => {
    const kindId = await kindIdByName(tx, userId, "關鍵字");
    const [oldFragment] = await tx
      .select({ id: fragments.id })
      .from(fragments)
      .where(
        and(eq(fragments.userId, userId), eq(fragments.kindId, kindId), eq(fragments.name, from)),
      );
    if (!oldFragment) return 0;

    const affected = await linkedIdsOf(userId, oldFragment.id);

    const [existing] = await tx
      .select({ id: fragments.id })
      .from(fragments)
      .where(
        and(eq(fragments.userId, userId), eq(fragments.kindId, kindId), eq(fragments.name, to)),
      );

    if (existing) {
      for (const ownerId of affected) await link(tx, userId, ownerId, existing.id);
      await unlinkAll(tx, userId, oldFragment.id);
      await tx.delete(fragments).where(eq(fragments.id, oldFragment.id));
      await setFragmentSourceUrl(tx, userId, oldFragment.id, "");
    } else {
      await tx.update(fragments).set({ name: to }).where(eq(fragments.id, oldFragment.id));
    }

    return affected.length;
  });
}

/** 刪掉這則關鍵字片段，連結靠 unlinkAll 一起清掉。回傳動到幾條連結 */
export async function deleteKeyword(userId: string, name: string): Promise<number> {
  return db.transaction(async (tx) => {
    const kindId = await kindIdByName(tx, userId, "關鍵字");
    const [old] = await tx
      .select({ id: fragments.id })
      .from(fragments)
      .where(
        and(eq(fragments.userId, userId), eq(fragments.kindId, kindId), eq(fragments.name, name)),
      );
    if (!old) return 0;

    const affected = await linkedIdsOf(userId, old.id);

    await unlinkAll(tx, userId, old.id);
    await tx.delete(fragments).where(eq(fragments.id, old.id));
    await setFragmentSourceUrl(tx, userId, old.id, "");

    return affected.length;
  });
}
