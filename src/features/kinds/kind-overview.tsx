import { GroupOverview } from "@/components/ui/group-overview/group-overview";
import { KIND_CARD_GRID, KindCard } from "@/components/ui/kind-cards/kind-cards";
import { OverviewLayout } from "@/components/ui/overview-layout/overview-layout";
import { OverviewTotalStats } from "@/components/ui/overview-layout/overview-rail-stats";
import { unitOfKind } from "@/config/nav";
import {
  fragmentThreadRow,
  WRITING_THREAD_GRID,
  WritingThreadRow,
} from "@/features/writing/components/writing-thread-row";
import { FragmentRow, RecordRow } from "@/lib/db/queries/catalog";
import { Kind } from "@/lib/db/queries/kinds";
import { splitByStatus } from "@/utils/kind-list";
import { pickHeadline } from "@/utils/overview";
import { fragmentItem, recordItem } from "@/utils/overview-items";

/**
 * 類型頁的概覽：頭條、照月份排的格線、右側統計。
 *
 * 紀錄照狀態拆：進行中上頭條與右欄、想要只進右欄、完成的排格線。
 * 書寫一路往下讀，不要頭條；片段一格一張，卡片長相照 card_style。
 */
export function KindOverview({
  kind,
  records,
  fragments,
}: {
  kind: Kind;
  records: RecordRow[];
  fragments: FragmentRow[];
}) {
  const unit = unitOfKind(kind); // amountUnit 是份量（頁、分鐘），這裡要的是個數

  if (kind.group === "records") {
    const { active, pending, done } = splitByStatus(records);
    return (
      <GroupOverview
        active={active.map(recordItem)}
        pending={pending.map(recordItem)}
        done={done.map(recordItem)}
        headlineLabel={`進行中 · 最近開始的一${unit}`}
        unit={unit}
      />
    );
  }

  const byId = new Map(fragments.map((row) => [row.id, row]));
  const items = fragments.map(fragmentItem);

  if (kind.group === "writings") {
    return (
      <GroupOverview
        active={[]}
        pending={[]}
        done={items}
        headlineLabel="" // 一路往下讀的流，頭條會把最新那則講兩次
        unit={unit}
        renderItem={(item) => {
          const row = byId.get(item.id);
          return row ? <WritingThreadRow {...fragmentThreadRow(row)} /> : null;
        }}
        gridClassName={WRITING_THREAD_GRID}
        railDesktopOnly // 統計在手機上只是把內容往下推
      />
    );
  }

  return (
    <OverviewLayout
      headline={pickHeadline(items)}
      headlineLabel="最新一筆"
      done={items}
      unit={unit}
      rail={<OverviewTotalStats count={items.length} unit={unit} />}
      gridClassName={KIND_CARD_GRID[kind.cardStyle]}
      renderItem={(item) => {
        const row = byId.get(item.id);
        return row ? <KindCard style={kind.cardStyle} row={row} /> : null;
      }}
    />
  );
}
