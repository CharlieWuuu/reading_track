/**
 * 卡片牆。同列等高的 grid，不是瀑布式——卡片內文有 line-clamp，高度落在小
 * 範圍內，上下左右間距一致比鋪滿版面更值得。
 *
 * 原本叫 CardGrid，但它從來沒有瀑布過，名字騙人。
 */
export function CardGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
      {children}
    </div>
  );
}
