import { and, eq, inArray } from "drizzle-orm";
import { db, type Tx } from "@/lib/db/client";
import { linkedIdsOf } from "@/lib/db/queries/internal-links";
import { fragments } from "@/lib/db/schema/fragments";
import { records } from "@/lib/db/schema/works";
import { KeywordInfo } from "@/types/keyword";
import { QuoteRow, VocabularyRow } from "@/types/record";
import { setFragmentSourceUrl } from "./external-links";
import { link, unlink, unlinkAll } from "./internal-links";
import { kindIdBySlug } from "./kind-lookup";

/**
 * 佳句、單字、關鍵字的寫入。三種都在 fragments 表裡，靠類型分。
 *
 * 畫面送進來的 bookId 是「某一次讀」的編號，資料庫記的是「哪個作品」——
 * 換算在這一層做完，呼叫端不用知道有這回事。
 *
 * 跟作品的關聯走 internal_links，跟關鍵字連誰是同一套機制，不再有自己的欄位。
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

/** 某個作品底下某一種片段整批換掉：先找出屬於它的（靠 internal_links），刪掉再把新的加回去並重新連結 */
async function replaceFragments(
  userId: string,
  workId: string,
  kindSlug: string,
  rows: (kindId: string) => Record<string, unknown>[],
): Promise<void> {
  await db.transaction(async (tx) => {
    const kindId = await kindIdBySlug(tx, userId, kindSlug);
    const linkedIds = await linkedIdsOf(userId, workId, tx);
    const existing =
      linkedIds.length > 0
        ? await tx
            .select({ id: fragments.id })
            .from(fragments)
            .where(
              and(
                eq(fragments.userId, userId),
                eq(fragments.kindId, kindId),
                inArray(fragments.id, linkedIds),
              ),
            )
        : [];

    for (const row of existing) await unlinkAll(tx, userId, row.id);
    if (existing.length)
      await tx.delete(fragments).where(
        inArray(
          fragments.id,
          existing.map((row) => row.id),
        ),
      );

    const values = rows(kindId);
    if (values.length) {
      await tx.insert(fragments).values(values as never);
      for (const value of values) await link(tx, userId, (value as { id: string }).id, workId);
    }
  });
}

export async function replaceBookQuotes(
  userId: string,
  readingId: string,
  items: QuoteRow[],
): Promise<void> {
  const workId = await workIdOf(userId, readingId);
  if (!workId) return;

  await replaceFragments(userId, workId, "quotes", (kindId) =>
    items
      .filter((item) => item.text.trim())
      .map((item) => ({
        id: item.id || crypto.randomUUID(),
        userId,
        kindId,
        phrase: item.text,
        locator: item.chapter,
        body: item.note,
        date: item.date,
        coverUrl: item.coverUrl,
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

  await replaceFragments(userId, workId, "vocabulary", (kindId) =>
    items
      .filter((item) => item.word.trim())
      .map((item) => ({
        id: item.id || crypto.randomUUID(),
        userId,
        kindId,
        name: item.word,
        pronunciation: item.pronunciation,
        translation: item.wordTranslation,
        context: item.sentence,
        contextTranslation: item.sentenceTranslation,
        locator: item.chapter,
        date: item.date,
        coverUrl: item.coverUrl,
      })),
  );
}

/**
 * 把一筆已存在的佳句／單字改連到另一本書（或拔掉出處）。
 *
 * 跟 replaceBookQuotes 不同：那支是「這本書底下的全部換一批」，這支是單筆
 * 換它的出處——書籍紀錄分頁挑一筆既有的接上來，不是新增內容，用這支。
 * readingId 空字串代表拔掉出處，回到沒有書的狀態。
 */
export async function relinkFragment(
  userId: string,
  fragmentId: string,
  readingId: string,
): Promise<void> {
  const workId = await workIdOf(userId, readingId);
  await db.transaction(async (tx) => {
    await unlinkAll(tx, userId, fragmentId);
    if (workId) await link(tx, userId, fragmentId, workId);
  });
}

/**
 * 單列新增。整批取代是以「哪個作品」為單位的，沒有作品就沒有那個單位——
 * 抄到一句話不是從書上看到的，走這條進來，不連結任何作品。
 *
 * 選了書但那個 readingId 查不到作品時視為無出處，不是丟錯：寧可留下這一筆。
 */
export async function addQuote(userId: string, readingId: string, item: QuoteRow): Promise<void> {
  if (!item.text.trim()) return;
  // 交易外先查好：在交易裡用外層的 db 會等自己解鎖
  const workId = await workIdOf(userId, readingId);
  const id = item.id || crypto.randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(fragments).values({
      id,
      userId,
      kindId: await kindIdBySlug(tx, userId, "quotes"),
      phrase: item.text,
      locator: item.chapter,
      body: item.note,
      date: item.date,
      coverUrl: item.coverUrl,
    });
    if (workId) await link(tx, userId, id, workId);
  });
}

export async function addVocabulary(
  userId: string,
  readingId: string,
  item: VocabularyRow,
): Promise<void> {
  if (!item.word.trim()) return;
  const workId = await workIdOf(userId, readingId);
  const id = item.id || crypto.randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(fragments).values({
      id,
      userId,
      kindId: await kindIdBySlug(tx, userId, "vocabulary"),
      name: item.word,
      pronunciation: item.pronunciation,
      translation: item.wordTranslation,
      context: item.sentence,
      contextTranslation: item.sentenceTranslation,
      locator: item.chapter,
      date: item.date,
      coverUrl: item.coverUrl,
    });
    if (workId) await link(tx, userId, id, workId);
  });
}

/** 關鍵字片段，查不到就自己長一個出來——名字是唯一的身分 */
export async function keywordFragmentId(tx: Tx, userId: string, name: string): Promise<string> {
  const kindId = await kindIdBySlug(tx, userId, "keywords");
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
 *
 * 不能走 setLinks 的「先清光這個 id 的所有連結」——ownerId 是書/文章本身，
 * 它名下還掛著佳句、單字這些不相干的連結，全清會把那些一起弄丟。
 * 這裡只動「對方是關鍵字」的那幾條邊：先找出舊的關鍵字連結、跟新名單做差集。
 */
export async function setKeywordLinks(
  tx: Tx,
  userId: string,
  ownerId: string,
  names: string[],
): Promise<void> {
  const keywordKindId = await kindIdBySlug(tx, userId, "keywords");
  const linkedIds = await linkedIdsOf(userId, ownerId, tx);
  const oldKeywordIds = linkedIds.length
    ? (
        await tx
          .select({ id: fragments.id })
          .from(fragments)
          .where(
            and(
              eq(fragments.userId, userId),
              eq(fragments.kindId, keywordKindId),
              inArray(fragments.id, linkedIds),
            ),
          )
      ).map((row) => row.id)
    : [];

  const newIds = await Promise.all(names.map((name) => keywordFragmentId(tx, userId, name)));
  const newIdSet = new Set(newIds);

  for (const id of oldKeywordIds) if (!newIdSet.has(id)) await unlink(tx, userId, ownerId, id);
  for (const id of newIds) await link(tx, userId, ownerId, id);
}

/** 維基查回來的資料整批寫入；已經有的就更新，不動使用者自己填的名字 */
export async function saveKeywordInfos(userId: string, infos: KeywordInfo[]): Promise<void> {
  await db.transaction(async (tx) => {
    const kindId = await kindIdBySlug(tx, userId, "keywords");

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
    const kindId = await kindIdBySlug(tx, userId, "keywords");
    const [oldFragment] = await tx
      .select({ id: fragments.id })
      .from(fragments)
      .where(
        and(eq(fragments.userId, userId), eq(fragments.kindId, kindId), eq(fragments.name, from)),
      );
    if (!oldFragment) return 0;

    const affected = await linkedIdsOf(userId, oldFragment.id, tx);

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
    const kindId = await kindIdBySlug(tx, userId, "keywords");
    const [old] = await tx
      .select({ id: fragments.id })
      .from(fragments)
      .where(
        and(eq(fragments.userId, userId), eq(fragments.kindId, kindId), eq(fragments.name, name)),
      );
    if (!old) return 0;

    const affected = await linkedIdsOf(userId, old.id, tx);

    await unlinkAll(tx, userId, old.id);
    await tx.delete(fragments).where(eq(fragments.id, old.id));
    await setFragmentSourceUrl(tx, userId, old.id, "");

    return affected.length;
  });
}
