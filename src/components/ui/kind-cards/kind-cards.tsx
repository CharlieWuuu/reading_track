import Link from "next/link";
import { CardGrid } from "@/components/ui/card-grid";
import { CoverCard } from "@/components/ui/cover-card/cover-card";
import { FragmentCard } from "@/components/ui/fragment-card/fragment-card";
import { QuoteWall } from "@/components/ui/quote-wall/quote-wall";
import { CardStyle } from "@/config/card-styles";
import { FragmentRow } from "@/lib/db/queries/catalog";
import { fragmentCard, fragmentHref, fragmentTitle } from "@/utils/overview-items";

/**
 * 一落片段照類型選的畫法排出來。
 *
 * 畫法從 kinds.card_style 來，不從 slug 猜——概覽頁、類型頁、設定頁的預覽
 * 全部走這一支，同一種類型在三個地方才長得一樣。
 */

const styles = {
  lines: "flex flex-col",
  line: "border-rule-soft text-ui text-ink-muted hover:text-ink truncate border-b py-[7px] pl-3 last:border-b-0",
};

export function KindCards({ style, rows }: { style: CardStyle; rows: FragmentRow[] }) {
  if (style === "quote") return <QuoteWall rows={rows} hrefOf={fragmentHref} />;

  if (style === "line") {
    return (
      <div className={styles.lines}>
        {rows.map((row) => (
          <Link key={row.id} href={fragmentHref(row)} className={styles.line}>
            {fragmentTitle(row)}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <CardGrid>
      {rows.map((row) =>
        style === "cover" ? (
          <CoverCard
            key={row.id}
            id={row.id}
            href={fragmentHref(row)}
            title={fragmentTitle(row)}
            label={row.domain} // 綠字是主題，跟書籍概覽頁一致
            coverUrl={row.coverUrl}
          />
        ) : (
          <FragmentCard key={row.id} {...fragmentCard(row)} />
        ),
      )}
    </CardGrid>
  );
}
