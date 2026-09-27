import { CardStyle, toCardStyle } from "@/config/card-styles";
import { kindHref } from "@/config/kind-routes";
import { FragmentRow, RecordRow } from "@/lib/db/queries/catalog";
import { splitLines, splitTags } from "@/types/book";
import { Writing } from "@/types/writing";
import {
  fragmentBody,
  fragmentHref,
  fragmentLabel,
  fragmentMeta,
  fragmentTitle,
} from "./overview-items";

/**
 * 一張卡要的全部資料，不管畫成哪一種樣式。純轉換，不查資料。
 *
 * 紀錄、片段、書寫三種列形狀不同，本來各自配一種寫死的卡片：紀錄一律封面卡、
 * 書寫一律整則。先攤成這個形狀，畫成哪一種交給類型的 card_style。
 */
export type CardData = {
  id: string;
  href: string;
  title: string;
  label: string; // 標題右邊的綠字：單字的字義
  tag: string; // 主題，封面卡右上那行綠字
  body: string; // 內文；紀錄是作品的摘要
  detail: string; // 標題上方的小字：發音
  meta: string; // 出處或作者・份量
  creator: string; // 作者；片段與書寫沒有
  platform: string; // 在哪讀的；片段與書寫沒有
  date: string; // 完成日；片段沒填就用記下的時間
  topic: string; // 整則的頭像與色塊
  keywords: string[];
  coverUrl: string;
  coverTitle: string; // 封面的替代文字
};

const joinByline = (parts: (string | number | null | undefined | false)[]) =>
  parts.filter(Boolean).join("・");

export const recordCardData = (row: RecordRow): CardData => ({
  id: row.id,
  href: `${kindHref(row.kindGroup, row.kindSlug)}/${row.id}`,
  title: row.title,
  label: "",
  tag: row.domain,
  body: row.body,
  detail: "",
  creator: row.creator,
  platform: row.platform,
  meta: joinByline([row.creator, row.platform, row.amount && `${row.amount} ${row.amountUnit}`]),
  date: row.endDate ?? row.startDate ?? "",
  topic: row.kindName,
  keywords: [],
  coverUrl: row.coverUrl,
  coverTitle: row.title,
});

export const fragmentCardData = (row: FragmentRow): CardData => ({
  id: row.id,
  href: fragmentHref(row),
  title: fragmentTitle(row),
  label: fragmentLabel(row),
  tag: row.domain,
  body: fragmentBody(row) || row.note,
  detail: row.pronunciation,
  creator: "",
  platform: "",
  meta: fragmentMeta(row),
  date: row.date ?? row.createdAt,
  topic: row.kindName,
  keywords: splitTags(row.tags),
  coverUrl: row.coverUrl,
  coverTitle: row.workTitle,
});

/** 書寫那張舊表的一筆。/writings/writing 那頁還讀它 */
export const writingCardData = (w: Writing): CardData => ({
  id: w.id,
  href: `/writings/writing/${w.id}`,
  title: w.title,
  label: "",
  tag: w.topic,
  body: w.note,
  detail: "",
  creator: "",
  platform: "",
  meta: "",
  date: w.endDate || w.createdAt,
  topic: w.topic || w.kindName,
  keywords: splitLines(w.keywords),
  coverUrl: w.coverUrl,
  coverTitle: w.title,
});

/** 一張卡連同它該畫成的樣式。樣式跟著那一筆的類型走，混排時才能各畫各的 */
export type StyledCard = { style: CardStyle; data: CardData };

export const styledRecord = (row: RecordRow): StyledCard => ({
  style: row.kindCardStyle,
  data: recordCardData(row),
});

export const styledFragment = (row: FragmentRow): StyledCard => ({
  style: row.kindCardStyle,
  data: fragmentCardData(row),
});

export const styledWriting = (w: Writing): StyledCard => ({
  style: toCardStyle(w.kindCardStyle, "writings"),
  data: writingCardData(w),
});
