import { coverTintClass } from "@/utils/tag-colors";

/**
 * 概覽月份格線裡的封面帶，固定用大尺寸——不同頁面混用不同高度只會亂。
 *
 * 真封面與生成塊兩種畫法不混：
 * - 有 `coverUrl`：畫「書背」——傾斜、有陰影，這是實體物件的訊號。
 *   窄的時候（手機兩欄）改畫正封面，那個尺寸的書背只剩一條糊的
 * - 沒有：底色鋪滿，不放字——沒有封面的項目就是一塊純色塊
 *
 * 底色不是從封面圖算主色——封面來自外部網址，跨域讀像素常常被擋，
 * 划不來。固定色輪替＋漸層（下深上淺）就夠了。
 */

const BAND = "h-[148px]";
const SPINE = "h-[152px] w-[108px]";

export function CoverBand({ coverUrl, seed }: { coverUrl?: string; seed: string }) {
  if (coverUrl) {
    return (
      <div className={`${BAND} ${coverTintClass(seed)} flex items-end overflow-hidden`}>
        {/* 窄的時候（手機兩欄，一格約 160px）書背只剩一條，傾斜與陰影都看不出來，
            反而糊掉——那個尺寸直接畫正封面。md 以上才是書背 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverUrl}
          alt=""
          loading="lazy"
          className="mx-auto h-full w-auto object-contain md:hidden"
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverUrl}
          alt=""
          loading="lazy"
          className={`${SPINE} -mb-3 ml-3.5 hidden rotate-[-4deg] object-cover shadow-md md:block`}
        />
      </div>
    );
  }

  return <div className={`${BAND} ${coverTintClass(seed)}`} />;
}
