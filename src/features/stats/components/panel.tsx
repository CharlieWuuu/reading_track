/**
 * 圖表卡片：撐滿一頁的高度，圖本身用 100% 跟著縮放。
 *
 * 標題寫在卡片上而不是區塊上：一個區塊裡可能並排兩張圖（兩個樹狀圖、兩個圓餅），
 * 共用一行「分布」等於兩張圖都沒有名字。
 */
export function Panel({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-surface flex min-h-0 flex-1 flex-col gap-3.5 border bg-white p-3 md:p-5">
      {title && <p className="shrink-0 text-sm font-medium">{title}</p>}
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
