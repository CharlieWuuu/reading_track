"use client";

import { RankingItem } from "@/lib/bookStats";

/** 同一組深淺，名次越前面越深——排行不需要八種顏色，那只會變成裝飾 */
const SHADES = ["#184f95", "#2a63aa", "#3d78bf", "#5a90cf", "#82abdc"];

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
}: {
  title: string;
  data: RankingItem[];
  unit?: string;
  /** 顯示代表書封（重讀排行看的就是書本身，放封面最好認） */
  showCover?: boolean;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));

  return (
    <div className="flex h-full min-h-0 flex-col">
      <p className="mb-3.5 shrink-0 text-sm font-medium">{title}</p>

      {data.length === 0 ? (
        // 每個都只出現一次時榜單會是空的，說清楚原因比留一張空圖好
        <div className="flex min-h-0 flex-1 items-center justify-center text-center text-xs text-gray-400">
          還沒有累積 2 {unit}以上的項目
        </div>
      ) : (
        <ul className="flex min-h-0 flex-1 flex-col justify-center gap-2.5">
          {data.map((item, i) => (
            <li key={item.name} className="flex items-center gap-2">
              {showCover && <Cover url={item.coverUrl} title={item.name} />}

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="min-w-0 truncate text-xs text-gray-700">{item.name}</span>
                  <span className="shrink-0 text-xs tabular-nums text-gray-400">
                    {item.value} {unit}
                  </span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(item.value / max) * 100}%`,
                      background: SHADES[i % SHADES.length],
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
