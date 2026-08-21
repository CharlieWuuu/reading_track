/** 圖表卡片：撐滿一頁的高度，圖本身用 100% 跟著縮放 */
export function Panel({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3.5 rounded-lg bg-white p-3 md:p-5">
      {title && <p className="shrink-0 text-sm font-medium">{title}</p>}
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
