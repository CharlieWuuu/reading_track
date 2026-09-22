"use client";

import { OverviewLayout } from "@/components/ui/overview-layout/overview-layout";
import { OverviewRail } from "@/components/ui/overview-layout/overview-rail-list";
import { OverviewTotalStats } from "@/components/ui/overview-layout/overview-rail-stats";
import { OverviewItem, pickHeadline } from "@/utils/overview";

/**
 * 整個 group 的概覽：跟書籍概覽共用同一套骨架（OverviewLayout），
 * 差別只有右側窄欄——這裡收的是 OverviewItem 而不是 Book，紀錄那頁要把
 * 書籍、文章、電影混在同一份清單裡排，沒有共通的量化指標可以做統計區塊，
 * 右欄是統計／進行／想要，標籤全站固定，不開放呼叫端自訂。
 */

type GroupOverviewProps = {
  active: readonly OverviewItem[]; // 頭條從這裡挑
  pending: readonly OverviewItem[]; // 只進窄欄
  done: readonly OverviewItem[]; // 照月份排成多欄
  headlineLabel: string; // 頭條上方那行小字
  unit: string; // 接在大數字後面：筆、篇、則
  doneTotal?: number; // 分頁時 done 只是已載入的，統計數字用這個
  onLoadMore?: () => void; // 捲到底時呼叫，不給就是整包展示
  hasMore?: boolean;
  isLoadingMore?: boolean;
  extraRail?: React.ReactNode; // 右欄補的內容，書寫沒有進行／想要
  railDesktopOnly?: boolean; // 窄螢幕不插進內容裡
  renderItem?: (item: OverviewItem) => React.ReactNode; // 中間那格怎麼畫，不給就是封面卡
  gridClassName?: string; // 月份格線的欄數斷點
};

export function GroupOverview({
  active,
  pending,
  done,
  headlineLabel,
  unit,
  doneTotal,
  onLoadMore,
  hasMore,
  isLoadingMore,
  extraRail,
  railDesktopOnly,
  renderItem,
  gridClassName,
}: GroupOverviewProps) {
  // active 沒東西、但呼叫端有給頭條標籤時（例如書寫，記下就算完成，沒有
  // 進行中這個狀態，仍想秀「最新一則」），頭條改從 done 挑最新一筆；
  // 文章沒有中間狀態也沒有頭條，headlineLabel 傳空字串代表故意不要
  const fallbackToDone = active.length === 0 && headlineLabel !== "";
  const headline = fallbackToDone ? pickHeadline(done) : pickHeadline(active);

  return (
    <OverviewLayout
      headline={headline}
      headlineLabel={headlineLabel}
      done={done}
      unit={unit}
      tintSeed={(item) => item.topicLabel}
      onLoadMore={onLoadMore}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
      railDesktopOnly={railDesktopOnly}
      renderItem={renderItem}
      gridClassName={gridClassName}
      rail={
        <>
          <OverviewTotalStats
            count={active.length + pending.length + (doneTotal ?? done.length)}
            unit={unit}
          />
          {/* 頭條那本也留在清單裡：這份是「現在在讀什麼」，少一本就不是全部了 */}
          <OverviewRail label="進行" items={active} unit={unit} limit={5} />
          <OverviewRail label="想要" items={pending} unit={unit} limit={5} />
          {extraRail}
        </>
      }
    />
  );
}
