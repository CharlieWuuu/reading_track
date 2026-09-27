import { COVER_TILE_GRID, CoverTile, CoverTileProps } from "@/components/ui/cover-tile/cover-tile";
import { kindHref } from "@/config/kind-routes";
import { unitOfKind } from "@/config/nav";
import { FragmentRow, RecordRow } from "@/lib/db/queries/catalog";
import { Kind } from "@/lib/db/queries/kinds";
import { byYear, moduleKeysByKind, STATUS_LABEL, statusOf, tileMeta } from "@/utils/kind-list";
import { fragmentHref } from "@/utils/overview-items";

/**
 * 卡片檢視：書封牆。勾了封面圖的類型才有這個檢視（見 kind-views）。
 *
 * 跟書籍原本的書封牆一樣：小張書封密排、左上角狀態點、底下書名與完成日，照完成年分段。
 * 不照 card_style——那是概覽與其他地方用的。
 */

const styles = {
  wall: "flex flex-col gap-6",
  section: "flex flex-col gap-2",
  head: "border-rule-strong flex items-baseline justify-between border-b pb-1.5",
  label: "text-item-sm font-serif font-semibold",
  count: "text-meta text-ink-faint tabular-nums",
};

type Tile = { id: string; endDate: string | null; tile: CoverTileProps };

export function KindCardWall({
  kind,
  records,
  fragments,
}: {
  kind: Kind;
  records: RecordRow[];
  fragments: FragmentRow[];
}) {
  const unit = unitOfKind(kind);
  const keys = moduleKeysByKind([kind]).get(kind.id);

  const tiles: Tile[] =
    kind.group === "records"
      ? records.map((row) => {
          const status = statusOf(row, keys);
          return {
            id: row.id,
            endDate: status === "done" ? row.endDate : null, // 沒完成的歸「未完成」那段
            tile: {
              href: `${kindHref(kind.group, kind.slug)}/${row.id}`,
              title: row.title,
              coverUrl: row.coverUrl,
              status: STATUS_LABEL[status],
              meta: tileMeta(row.endDate, status),
            },
          };
        })
      : // 片段沒有狀態，記下就算；沒填日期的用記下的那天
        fragments.map((row) => {
          const date = row.date ?? row.createdAt.slice(0, 10);
          return {
            id: row.id,
            endDate: date,
            tile: {
              href: fragmentHref(row),
              title: row.title || row.body,
              coverUrl: row.coverUrl,
              meta: date,
            },
          };
        });

  return (
    <div className={styles.wall}>
      {byYear(tiles, "未完成").map((group) => (
        <section key={group.label} className={styles.section}>
          <div className={styles.head}>
            <span className={styles.label}>{group.label}</span>
            <span className={styles.count}>
              {group.items.length} {unit}
            </span>
          </div>
          <ul className={COVER_TILE_GRID}>
            {group.items.map((item) => (
              <li key={item.id}>
                <CoverTile {...item.tile} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
