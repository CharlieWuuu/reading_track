/**
 * 卡片牆。改用 grid 而非瀑布式：卡片內文有 line-clamp，高度落在小範圍內，
 * 同列等高換來上下左右間距一致，比瀑布式鋪滿版面更值得。
 */
export function CardMasonry({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {children}
    </div>
  );
}
