/**
 * 轉圈圈。用 border 畫而不是 SVG：一個 span 就夠，顏色跟著 currentColor 走，
 * 放進按鈕或文字旁邊都不用另外配色。
 *
 * 整圈畫一條淡的當軌道，頂端與右側是實色——只亮一小段的話，小尺寸下看不出它在轉。
 *
 * 四邊都用長寫（border-t/r/b/l）而不是「簡寫上淡色再用長寫蓋兩邊」：兩者具體性一樣，
 * 誰生效由產出的先後決定，簡寫排在後面就會把四邊壓成同色，看起來整圈不動。
 * 轉一圈 0.7 秒：預設的 1 秒在只有一段實色時像慢慢飄。
 */
export function Spinner({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      role="status"
      aria-label="載入中"
      style={{ width: size, height: size, borderWidth: Math.max(1.5, size / 9) }}
      className={`inline-block animate-spin rounded-full border-t-current border-r-current border-b-current/20 border-l-current/20 align-[-0.125em] [animation-duration:0.7s] ${className}`}
    />
  );
}
