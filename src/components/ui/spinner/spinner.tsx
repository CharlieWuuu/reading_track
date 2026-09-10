/**
 * 轉圈圈。樣式定義在 globals.css 的 .loader：box-shadow inset 畫一圈淡的軌道，
 * 頂端一小段實色轉動。顏色跟著 currentColor 走，放進按鈕或文字旁邊都不用另外配色。
 */
export function Spinner({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      role="status"
      aria-label="載入中"
      style={{ "--size": `${size / 100}px` } as React.CSSProperties}
      className={`loader inline-block align-[-0.125em] ${className}`}
    />
  );
}
