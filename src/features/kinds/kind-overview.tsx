import { GroupOverview } from "@/components/ui/group-overview/group-overview";
import { styledGrid } from "@/components/ui/kind-cards/kind-cards";
import { OverviewLayout } from "@/components/ui/overview-layout/overview-layout";
import { OverviewTotalStats } from "@/components/ui/overview-layout/overview-rail-stats";
import { unitOfKind } from "@/config/nav";
import { FragmentRow, RecordRow } from "@/lib/db/queries/catalog";
import { Kind } from "@/lib/db/queries/kinds";
import { styledFragment, styledRecord } from "@/utils/card-data";
import { splitByStatus } from "@/utils/kind-list";
import { pickHeadline } from "@/utils/overview";
import { fragmentItem, recordItem } from "@/utils/overview-items";

/**
 * 類型頁的概覽：頭條、照月份排的格線、右側統計。一格長什麼樣照 card_style。
 *
 * 紀錄照狀態拆：進行中上頭條與右欄、想要只進右欄、完成的排格線。
 * 書寫一路往下讀，不要頭條；片段的頭條是最新一筆。
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
        {...styledGrid(records.map(styledRecord))} // 右欄的進行、想要也照樣式畫
      />
    );
  }

  const items = fragments.map(fragmentItem);
  const grid = styledGrid(fragments.map(styledFragment));

  if (kind.group === "writings") {
    return (
      <GroupOverview
        active={[]}
        pending={[]}
        done={items}
        headlineLabel="" // 一路往下讀的流，頭條會把最新那則講兩次
        unit={unit}
        railDesktopOnly // 統計在手機上只是把內容往下推
        {...grid}
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
      {...grid}
    />
  );
}
