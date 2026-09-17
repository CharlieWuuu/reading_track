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

export type GroupOverviewProps = {
  /** 進行中的，頭條從這裡挑 */
  active: readonly OverviewItem[];
  /** 待辦，只進窄欄 */
  pending: readonly OverviewItem[];
  /** 完成的，照月份排成多欄 */
  done: readonly OverviewItem[];
  /** 頭條上方那行小字，說明為什麼是它 */
  headlineLabel: string;
  /** 統計區塊大數字後面接的量詞，跟數字同一行，例如「筆」「篇」「則」 */
  unit: string;
  /** done 的真實總數——分頁時 done 只是目前已載入的那幾頁，統計數字要用這個而不是 done.length */
  doneTotal?: number;
  /** 捲到底時呼叫，不給就是原本的整包展示 */
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  /** 「進行」「想要」底下要多放的統計——書寫沒有這兩種狀態，右欄靠這個補內容 */
  extraRail?: React.ReactNode;
  /** 中間那格怎麼畫，直接轉給 OverviewLayout；不給就是封面卡 */
  renderItem?: (item: OverviewItem) => React.ReactNode;
  /** 月份格線的欄數斷點，直接轉給 OverviewLayout */
  gridClassName?: string;
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
      tintSeed={(item) => item.kindLabel}
      onLoadMore={onLoadMore}
      hasMore={hasMore}
      isLoadingMore={isLoadingMore}
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
