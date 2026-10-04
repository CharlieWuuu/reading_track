import Link from "next/link";
import { COVER_CARD_GRID, CoverCard } from "@/components/ui/cover-card/cover-card";
import { FRAGMENT_CARD_GRID, FragmentCard } from "@/components/ui/fragment-card/fragment-card";
import { QuoteRow } from "@/components/ui/quote-wall/quote-wall";
import { RowCard } from "@/components/ui/row-card/row-card";
import { THREAD_GRID, ThreadRow } from "@/components/ui/thread-row/thread-row";
import { CardStyle } from "@/config/card-styles";
import { CardData, StyledCard } from "@/utils/card-data";

/**
 * 一筆照它的類型選的卡片樣式畫。紀錄、片段、書寫都走這一支。
 *
 * 樣式從 kinds.card_style 來，不從 group 或 slug 猜——概覽、卡片牆、範圍報告、
 * 設定頁的預覽全部走這裡，同一種類型在每個地方才長得一樣。
 */

const styles = {
  lines: "flex flex-col",
  line: "border-rule-soft text-ui text-ink-muted hover:text-ink truncate border-b py-[7px] pl-3 last:border-b-0",
};

/** 一種樣式怎麼排。佳句、標題、整則、清單一列一筆，切成多欄會把長句擠成一行三四個字 */
const GRIDS: Record<CardStyle, string> = {
  cover: COVER_CARD_GRID,
  fragment: FRAGMENT_CARD_GRID,
  quote: styles.lines,
  line: styles.lines,
  thread: THREAD_GRID,
  row: "flex flex-col",
};

/**
 * 同一格裡混了幾種樣式（紀錄概覽裡書籍是封面卡、文章是清單）：可換行的 flex，
 * 每一筆照自己的樣式佔多寬。一列一筆的佔滿，封面卡跟自己的格線一樣兩兩一排。
 */
const MIXED = "flex flex-wrap gap-x-5 md:gap-x-8";
const HALF = "w-[calc((100%-1.25rem)/2)] md:w-[calc((100%-2rem)/2)]";

const MIXED_WIDTH: Record<CardStyle, string> = {
  cover: "w-full md:w-[calc((100%-2rem)/2)] xl:w-[calc((100%-4rem)/3)]", // 跟 COVER_CARD_GRID 同樣的欄數
  fragment: `${HALF} @2xl:w-[calc((100%-4rem)/3)] pb-3`, // 跟 FRAGMENT_CARD_GRID 同樣的欄數
  quote: "w-full",
  line: "w-full",
  row: "w-full",
  thread: "w-full py-3",
};

const isMixed = (cardStyles: readonly CardStyle[]) => new Set(cardStyles).size > 1;

export const gridOf = (cardStyles: readonly CardStyle[]): string =>
  isMixed(cardStyles) ? MIXED : GRIDS[cardStyles[0] ?? "fragment"];

/** 混排時這一筆佔多寬；只有一種樣式時交給格線，不另外給 */
export const itemClassOf = (cardStyles: readonly CardStyle[], style: CardStyle): string =>
  isMixed(cardStyles) ? MIXED_WIDTH[style] : "";

export function KindCard({ style, data }: { style: CardStyle; data: CardData }) {
  if (style === "quote") return <QuoteRow data={data} />;
  if (style === "thread") return <ThreadRow data={data} />;
  if (style === "row") return <RowCard data={data} />;
  if (style === "line") {
    return (
      <Link href={data.href} className={styles.line}>
        {data.title}
      </Link>
    );
  }
  if (style === "cover") {
    return (
      <CoverCard
        href={data.href}
        title={data.title}
        coverUrl={data.coverUrl}
        meta={data.date.slice(0, 10)}
        label={data.tag} // 綠字是主題
        body={data.body}
        caption={data.meta}
      />
    );
  }
  return (
    <FragmentCard
      href={data.href}
      title={data.title}
      label={data.label}
      body={data.body}
      detail={data.detail || undefined}
      meta={data.meta}
      coverUrl={data.coverUrl}
    />
  );
}

/** 窄欄裡不管哪種樣式都一列一筆：兩欄的片段卡擠在兩百多 px 裡一行只剩幾個字 */
export const STACKED = "flex flex-col gap-4";

/** 一疊同一種樣式的卡片 */
export function KindCards({
  style,
  items,
  stacked,
}: {
  style: CardStyle;
  items: readonly CardData[];
  stacked?: boolean;
}) {
  return (
    <div className={stacked ? STACKED : GRIDS[style]}>
      {items.map((data) => (
        <KindCard key={data.id} style={style} data={data} />
      ))}
    </div>
  );
}

/**
 * 概覽的月份格線要的兩樣：一格怎麼畫、整片怎麼排。
 * 每一筆照它自己的樣式，OverviewLayout 只認 id，這裡用 id 找回那一張。
 */
export function styledGrid(cards: readonly StyledCard[]) {
  const byId = new Map(cards.map((card) => [card.data.id, card]));
  const cardStyles = cards.map((card) => card.style);
  const widthOf = (widths: Record<CardStyle, string>) => (item: { id: string }) => {
    const card = byId.get(item.id);
    return card && isMixed(cardStyles) ? widths[card.style] : "";
  };
  return {
    gridClassName: gridOf(cardStyles),
    itemClassName: widthOf(MIXED_WIDTH),
    renderItem: (item: { id: string }) => {
      const card = byId.get(item.id);
      return card ? <KindCard {...card} /> : null;
    },
  };
}
