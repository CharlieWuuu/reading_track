"use client";

import { RankingItem } from "@/lib/bookStats";
import { SEQUENTIAL } from "@/lib/chartPalette";

/**
 * 排行用純 CSS 長條，不走 recharts。
 *
 * 這裡真正想看的是「誰上榜、幾次」，長度只是輔助；而且每一列還要放一張書封，
 * 在 SVG 裡塞圖片既難對齊也難裁切，用 HTML 反而簡單、字也清楚。
 */
export function RankingBar({
  title,
  data,
  unit = "本",
  showCover = false,
  emptyHint,
}: {
  title: string;
  /** 帶 doneValue 的項目會畫成兩段：深色是已完成、淺色是其餘 */
  data: Array<RankingItem & { doneValue?: number }>;
  unit?: string;
  /** 顯示代表書封（重讀排行看的就是書本身，放封面最好認） */
  showCover?: boolean;
  emptyHint?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    // 高度隨內容，不撐滿面板——排行的列數本來就少，硬撐只會在下面留一大片空白
    <div className="flex flex-col gap-3.5">
      <p className="shrink-0 text-sm font-medium">{title}</p>

      {data.length === 0 ? (
        // 每個都只出現一次時榜單會是空的，說清楚原因比留一張空圖好
        <div className="py-6 text-center text-xs text-gray-400">
          {emptyHint ?? `還沒有累積 2 ${unit}以上的項目`}
        </div>
      ) : (
        // 由上往下排：原本 justify-center 會讓清單在剩餘空間裡置中，
        // 標題到第一列的距離就隨面板高度浮動，看起來像標題的間距不一致
        <ul className="flex flex-col gap-2.5">
          {data.map((item, i) => (
            <li key={item.name} className="flex items-center gap-2">
              {showCover && <Cover url={item.coverUrl} title={item.name} />}

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 truncate text-xs text-gray-700">{item.name}</span>
                  <span className="shrink-0 text-xs text-gray-400 tabular-nums">
                    {item.doneValue !== undefined
                      ? `${item.doneValue} / ${item.value} ${unit}`
                      : `${item.value} ${unit}`}
                  </span>
                </div>
                <div className="mt-1 flex h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full"
                    style={{
                      width: `${((item.doneValue ?? item.value) / max) * 100}%`,
                      // 排行的長條全部同色（名次的深淺會被讀成假的差距），
                      // 深淺在這裡只代表一件事：完成與未完成
                      background: SEQUENTIAL[i % SEQUENTIAL.length],
                    }}
                  />
                  {item.doneValue !== undefined && (
                    <div
                      className="h-full"
                      style={{
                        width: `${((item.value - item.doneValue) / max) * 100}%`,
                        background: "#DCE6F1",
                      }}
                    />
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Cover({ url, title }: { url?: string; title: string }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        loading="lazy"
        className="aspect-2/3 w-7 shrink-0 rounded-sm object-cover shadow-sm"
      />
    );
  }
  return (
    <div className="flex aspect-2/3 w-7 shrink-0 items-center justify-center rounded-sm bg-gray-100 text-[9px] leading-tight text-gray-400">
      {title.slice(0, 2)}
    </div>
  );
}
