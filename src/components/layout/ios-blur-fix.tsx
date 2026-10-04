// iOS PWA 頂端系統模糊：上緣有 fixed 有底色的元素就不加。bg-clip-text 沒字，畫面不畫；opacity-0、hidden 會讓判定失效
// 出處：Qiita @na-trium-144「iOS 27 PWAで画面上端に表示されるブラーを消す方法」
export function IosBlurFix() {
  return (
    <div
      aria-hidden
      className="bg-background pointer-events-none fixed inset-x-0 top-0 z-[2147483647] h-[11px] bg-clip-text" // 高度要超過 10px；底色就是狀態列的顏色
    />
  );
}
