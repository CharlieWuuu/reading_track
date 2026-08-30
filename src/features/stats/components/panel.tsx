/**
 * 圖表卡片：撐滿一頁的高度，圖本身用 100% 跟著縮放。
 *
 * 標題寫在卡片上而不是區塊上：一個區塊裡可能並排兩張圖（兩個樹狀圖、兩個圓餅），
 * 共用一行「分布」等於兩張圖都沒有名字。
 */
export function Panel({
  title,
  titleAction,
  children,
}: {
  title?: string;
  titleAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-surface flex min-h-0 flex-1 flex-col gap-3.5 border bg-white p-3 md:p-5">
      {(title || titleAction) && (
        <div className="flex shrink-0 items-center justify-between gap-3">
          {title && <p className="text-sm font-medium">{title}</p>}
          {titleAction && <div className="ml-auto flex shrink-0 items-center">{titleAction}</div>}
        </div>
      )}
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
