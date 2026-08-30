/**
 * 詳細頁的排版零件。書籍那一頁先長出來，其餘四種（文章、紀事、佳句、單字）
 * 一樣是「一份文件」而不是「十張小卡」，所以共用同一套。
 */

/** 章節標題：字比內文小但深且粗，配一條細線——淡灰的小標會被內文蓋過去 */
export function DetailSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="border-rule-soft border-b pb-1.5 text-sm font-semibold text-gray-900">
        {title}
      </h3>
      {children}
    </section>
  );
}

/**
 * 資訊表的一列：欄位名稱在左，值在右，中間靠固定欄寬對齊成一直排。
 * 欄名最長三個字，欄寬照三個字給，剩下的寬度留給值。
 *
 * 沒有值就整列不畫——一排「—」只是在告訴人「這裡什麼都沒有」，佔的卻是
 * 跟有內容的欄位一樣的高度。
 */
export function DetailField({ label, children }: { label: string; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div className="grid grid-cols-[3.25rem_minmax(0,1fr)] items-baseline gap-2 py-1.5">
      <span className="text-xs text-gray-400">{label}</span>
      <div className="min-w-0 text-sm text-gray-800">{children}</div>
    </div>
  );
}

/**
 * 短欄位排成兩欄的資訊表，每列之間一條淺色分隔線，讀起來像一份目錄。
 *
 * 手機摺成一欄時兩組會上下接起來，接縫那一條要自己補——分隔線畫在各組內部，
 * 組跟組之間本來就沒有。桌機是並排的兩欄，補了反而多一條橫線。
 */
export function DetailFields({ children }: { children: React.ReactNode }) {
  return (
    <div className="divide-rule-soft [&>div]:divide-rule-soft grid grid-cols-1 gap-x-10 divide-y sm:grid-cols-2 sm:divide-y-0 [&>div]:divide-y">
      {children}
    </div>
  );
}
