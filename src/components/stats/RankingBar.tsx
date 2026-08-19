"use client";

import { BookCover } from "@/components/ui/book-cover";

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
  data: RankingItem[];
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
              {showCover && <BookCover url={item.coverUrl ?? ""} title={item.name} size="md" />}

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 truncate text-xs text-gray-700">{item.name}</span>
                  <span className="shrink-0 text-xs text-gray-400 tabular-nums">
                    {item.value} {unit}
                  </span>
                </div>
                <div className="mt-1 flex h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full"
                    style={{
                      width: `${(item.value / max) * 100}%`,
                      background: SEQUENTIAL[i % SEQUENTIAL.length],
                    }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
