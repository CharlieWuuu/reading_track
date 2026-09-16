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
  /** 佔滿一整排而不是半排。概覽那排數字卡橫著擺，擠進半排會折成好幾列 */
  fullWidth?: boolean;
};

/**
 * 統計頁的區塊，桌機兩欄、手機一欄。
 *
 * 兩欄是因為這些圖多半是成對在看的——每月與累積、領域與語言、作者與平台。
 * 單欄的時候要捲很久才對得起來，並排一眼就比得出。
 *
 * 高度統一在這裡給：圖表是 height="100%"，父層沒高度會縮成 0。
 * 每一格自己畫框線而不是用分隔線——兩欄之下一條橫線分不出它屬於左邊還右邊。
 */
export function SectionList({ sections }: { sections: Section[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {sections.map((section) => (
        <div
          key={section.key}
          className={`flex min-w-0 flex-col ${section.fullWidth ? "lg:col-span-2" : ""} ${
            section.needsHeight === false ? "" : "h-[26rem] sm:h-[30rem]"
          }`}
        >
          {section.needsHeight === false ? (
            section.node
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">{section.node}</div>
          )}
        </div>
      ))}
    </div>
  );
}
