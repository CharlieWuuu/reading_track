/**
 * 書封，以及沒有書封時的替代方塊。
 *
 * 這一組原本在十個地方各寫一份，尺寸、圓角、陰影都對不太起來——同一本書在
 * 清單、卡片、視窗裡長得不一樣。尺寸收斂成幾個級距，要新的級距就加在這裡。
 *
 * 一律 aspect-2/3：書封的比例是固定的，讓高度自己從寬度長出來，
 * 圖還沒載完也不會把版面推來推去。
 */

const SIZES = {
  /** 一整排小封面當註腳用（關鍵字卡、單字卡） */
  xs: "w-4 rounded-[2px]",
  /** 視窗裡的清單 */
  sm: "w-5 rounded-[2px]",
  /** 排行榜 */
  md: "w-7 rounded-sm",
  /** 一列一則的清單（片段、單字編輯） */
  lg: "w-8 rounded-sm md:w-11",
  /** 表格的一列 */
  xl: "w-10 rounded-sm",
  /** 搜尋結果那一列 */
  search: "w-12 rounded-sm",
  /** 詳細頁那張大的 */
  detail: "w-24 rounded md:w-32",
  /** 書封牆：寬度交給格線 */
  full: "w-full rounded",
} as const;

const TEXT = {
  xs: "text-[7px] leading-none",
  sm: "text-[7px] leading-none",
  md: "text-[9px] leading-tight",
  lg: "text-[10px] leading-tight",
  xl: "text-[10px] leading-tight",
  search: "text-[10px] leading-tight",
  detail: "text-xs leading-snug",
  full: "text-xs leading-snug",
} as const;

export type BookCoverSize = keyof typeof SIZES;

/** 沒有書封時取書名前幾個字；越小的框放得下的字越少 */
const INITIALS: Record<BookCoverSize, number> = {
  xs: 1,
  sm: 1,
  md: 2,
  lg: 2,
  xl: 2,
  search: 2,
  detail: 12,
  full: 12,
};

export function BookCover({
  url,
  title,
  size = "lg",
  flat = false,
  className = "",
}: {
  url: string;
  title: string;
  size?: BookCoverSize;
  /** 不畫外框與陰影：圖例外面已經有一圈顏色，再加一圈只會變髒 */
  flat?: boolean;
  /** 額外的定位或效果，例如書封牆的 hover 陰影 */
  className?: string;
}) {
  const shape = `aspect-2/3 shrink-0 ${SIZES[size]} ${className}`;

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        loading="lazy"
        title={title}
        className={`${shape} object-cover ${flat ? "" : "shadow-sm ring-1 ring-black/10"}`}
      />
    );
  }

  return (
    <div
      title={title}
      className={`${shape} flex items-center justify-center bg-gray-100 p-1 text-center text-gray-400 ${TEXT[size]}`}
    >
      {title.slice(0, INITIALS[size]) || "—"}
    </div>
  );
}
