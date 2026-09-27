import Link from "next/link";
import { CardGrid } from "@/components/ui/card-grid";
import { COVER_CARD_GRID, CoverCard } from "@/components/ui/cover-card/cover-card";
import { FRAGMENT_CARD_GRID, FragmentCard } from "@/components/ui/fragment-card/fragment-card";
import { QuoteRow, QuoteWall } from "@/components/ui/quote-wall/quote-wall";
import { CardStyle } from "@/config/card-styles";
import { FragmentRow } from "@/lib/db/queries/catalog";
import { fragmentCard, fragmentHref, fragmentTitle } from "@/utils/overview-items";

/**
 * 一落片段照類型選的卡片樣式排出來。
 *
 * 樣式從 kinds.card_style 來，不從 slug 猜——概覽、卡片牆、設定頁的預覽
 * 全部走這一支，同一種類型在三個地方才長得一樣。
 */

const styles = {
  lines: "flex flex-col",
  line: "border-rule-soft text-ui text-ink-muted hover:text-ink truncate border-b py-[7px] pl-3 last:border-b-0",
};

/** 一格一張時的排法。佳句與單行一列一筆，切成兩欄會把長句擠成一行三四個字 */
export const KIND_CARD_GRID: Record<CardStyle, string> = {
  cover: COVER_CARD_GRID,
  fragment: FRAGMENT_CARD_GRID,
  quote: styles.lines,
  line: styles.lines,
};

/** 單獨一張。概覽照月份一格一格排時用這支 */
export function KindCard({ style, row }: { style: CardStyle; row: FragmentRow }) {
  if (style === "quote") return <QuoteRow row={row} href={fragmentHref(row)} />;
  if (style === "line") {
    return (
      <Link href={fragmentHref(row)} className={styles.line}>
        {fragmentTitle(row)}
      </Link>
    );
  }
  if (style === "cover") {
    return (
      <CoverCard
        id={row.id}
        href={fragmentHref(row)}
        title={fragmentTitle(row)}
        label={row.domain} // 綠字是主題，跟書籍概覽頁一致
        coverUrl={row.coverUrl}
      />
    );
  }
  return <FragmentCard {...fragmentCard(row)} />;
}

export function KindCards({ style, rows }: { style: CardStyle; rows: FragmentRow[] }) {
  if (style === "quote") return <QuoteWall rows={rows} hrefOf={fragmentHref} />;
  if (style === "line") {
    return (
      <div className={styles.lines}>
        {rows.map((row) => (
          <KindCard key={row.id} style={style} row={row} />
        ))}
      </div>
    );
  }
  return (
    <CardGrid>
      {rows.map((row) => (
        <KindCard key={row.id} style={style} row={row} />
      ))}
    </CardGrid>
  );
}
