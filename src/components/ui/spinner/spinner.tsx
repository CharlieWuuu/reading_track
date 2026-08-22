/**
 * 轉圈圈。用 border 畫而不是 SVG：一個 span 就夠，顏色跟著 currentColor 走，
 * 放進按鈕或文字旁邊都不用另外配色。
 */
export function Spinner({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      role="status"
      aria-label="載入中"
      style={{ width: size, height: size, borderWidth: Math.max(1.5, size / 9) }}
      className={`inline-block animate-spin rounded-full border-current border-r-transparent align-[-0.125em] ${className}`}
    />
  );
}
