"use client";

export type Section = {
  key: string;
  /** 只給人在程式裡認這一段用；畫面上的標題寫在各自的 Panel 上 */
  label: string;
  node: React.ReactNode;
  /**
   * 這個區塊需要外面給高度嗎？
   *
   * 圖表是 height="100%" 的 SVG，父層沒有高度就會縮成 0，所以預設為 true。
   * 排行那種高度隨內容的清單要設 false，不然會被硬撐成一個固定高度。
   */
  needsHeight?: boolean;
  /**
   * 這個區塊要多高。趨勢圖只要看得出形狀就夠，給滿版高度會讓手機捲很久；
   * 圓餅圖的標籤要位置，維持預設。
   */
  scrollHeight?: string;
};

/**
 * 統計頁的區塊一路往下排。每個區塊要給明確高度——圖表是 height="100%"，
 * 父層沒高度會縮成 0。
 *
 * 區塊之間一條線而不只是空白：一頁有六七塊，只靠空白看不出「這裡換了一個主題」。
 * 線畫在外層的包裝上，高度留在內層——`h-[26rem]` 是 border-box，
 * padding 加在同一層會把圖表壓小。
 *
 * 標題不畫在這裡：一個區塊裡可能並排兩張圖（兩個樹狀圖、兩個圓餅），
 * 共用一行「分布」等於兩張圖都沒有名字。改成每張卡自己寫，見 Panel。
 */
export function SectionList({ sections }: { sections: Section[] }) {
  return (
    <div className="flex shrink-0 flex-col">
      {sections.map((section) => (
        <div key={section.key} className="shrink-0 border-t py-6 first:border-t-0 first:pt-0">
          <div
            className={`flex flex-col gap-3.5 ${
              section.needsHeight === false
                ? ""
                : (section.scrollHeight ?? "h-[26rem] sm:h-[32rem]")
            }`}
          >
            {section.needsHeight === false ? (
              section.node
            ) : (
              <div className="flex min-h-0 flex-1 flex-col">{section.node}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
