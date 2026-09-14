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

/**
 * 色帶切齊封面上緣。
 *
 * 書背往下偏 12px（-mb-3）製造「插在架上」的效果，所以色帶要比書背矮這麼多，
 * 不然上面會空一截純色。兩種畫法的總高度維持一致：色帶 + 溢出的 12px。
 */
const BAND = "h-[112px] md:h-[140px]";
// 手機一格窄，書背等比縮一號；傾斜與陰影兩邊都留著——那是「這是一本書」的訊號
const SPINE = "h-[124px] w-[88px] md:h-[152px] md:w-[108px]";
/** 書背比色帶高，溢出的部分要有地方站，不然會蓋到上面那行日期 */
const OVERFLOW_ROOM = "pt-3";

export function CoverBand({ coverUrl, seed }: { coverUrl?: string; seed: string }) {
  if (coverUrl) {
    return (
      <div className={OVERFLOW_ROOM}>
        <div className={`${BAND} ${coverTintClass(seed)} flex items-end overflow-hidden`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverUrl}
            alt=""
            loading="lazy"
            className={`${SPINE} -mb-3 ml-2.5 rotate-[-4deg] object-cover shadow-md md:ml-3.5`}
          />
        </div>
      </div>
    );
  }

  // 沒封面的色塊也留同一段空間，兩種畫法佔的總高度才一樣
  return (
    <div className={OVERFLOW_ROOM}>
      <div className={`${BAND} ${coverTintClass(seed)}`} />
    </div>
  );
}
