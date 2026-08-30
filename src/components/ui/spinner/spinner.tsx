/**
 * 轉圈圈。用 border 畫而不是 SVG：一個 span 就夠，顏色跟著 currentColor 走，
 * 放進按鈕或文字旁邊都不用另外配色。
 *
 * 整圈畫一條淡的當軌道，頂端與右側是實色——只亮一小段的話，小尺寸下看不出它在轉。
 * 轉一圈 0.7 秒：預設的 1 秒在只有一段實色時像慢慢飄。
 */
export function Spinner({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      role="status"
      aria-label="載入中"
      style={{ width: size, height: size, borderWidth: Math.max(1.5, size / 9) }}
      className={`inline-block animate-spin rounded-full border-current/20 border-t-current border-r-current align-[-0.125em] [animation-duration:0.7s] ${className}`}
    />
  );
}
