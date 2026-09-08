import { coverTintClass } from "@/utils/tag-colors";

/**
 * 概覽月份格線裡的封面帶。份量跟著主角走：紀錄類的圖比較大，
 * 片段與專欄的主角是文字，帶子矮一階（呼叫端決定 size）。
 *
 * 真封面與生成塊兩種畫法不混：
 * - 有 `coverUrl`：畫「書背」——傾斜、有陰影，這是實體物件的訊號
 * - 沒有：底色鋪滿，中間放一小段字（有就放，例如單字、關鍵字本身）
 *
 * 底色不是從封面圖算主色——封面來自外部網址，跨域讀像素常常被擋，
 * 划不來。固定色輪替＋漸層（下深上淺）就夠了。
 */

const SIZE = {
  lg: { band: "h-[148px]", spine: "h-[152px] w-[108px]" },
  sm: { band: "h-24", spine: "h-[99px] w-[70px]" },
} as const;

export type CoverBandSize = keyof typeof SIZE;

export function CoverBand({
  coverUrl,
  seed,
  label,
  size = "sm",
}: {
  coverUrl?: string;
  /** 底色與生成塊字的固定色相依據——通常是標題或 id */
  seed: string;
  /** 沒有封面時置中顯示的字；沒有就留空底色 */
  label?: string;
  size?: CoverBandSize;
}) {
  const dims = SIZE[size];

  if (coverUrl) {
    return (
      <div className={`${dims.band} ${coverTintClass(seed)} flex items-end overflow-hidden`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverUrl}
          alt=""
          loading="lazy"
          className={`${dims.spine} -mb-3 ml-3.5 rotate-[-4deg] object-cover shadow-md`}
        />
      </div>
    );
  }

  return (
    <div
      className={`${dims.band} ${coverTintClass(seed)} flex items-center justify-center px-3.5 text-center`}
    >
      {label && (
        <span className="text-item-sm text-ink-faint font-serif leading-snug tracking-wide">
          {label}
        </span>
      )}
    </div>
  );
}
