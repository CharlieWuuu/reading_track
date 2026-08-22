import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * 前／後翻的圓角虛線按鈕。列表翻頁、統計區塊翻頁、月曆換月都是同一個動作，
 * 樣式集中在這裡，才不會每個地方各長一套。
 */
export function PagerButton({
  direction,
  onClick,
  disabled = false,
  label,
}: {
  direction: "prev" | "next";
  onClick: () => void;
  disabled?: boolean;
  /** 說明這一次翻的是什麼（上一頁／上個月），給讀螢幕的人聽 */
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="rounded-control border-rule hover:border-rule-strong disabled:hover:border-rule flex h-7 w-7 items-center justify-center border border-dashed leading-none text-gray-400 hover:text-gray-900 disabled:opacity-30 disabled:hover:text-gray-400"
    >
      {direction === "prev" ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
    </button>
  );
}
