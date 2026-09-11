"use client";

import Link from "next/link";
import { styles } from "@/components/ui/controls/styles";

type ActionButtonProps = {
  children: React.ReactNode;
  /** 給了就是連結，沒給就是按鈕 */
  href?: string;
  onClick?: () => void;
  tone?: "primary" | "secondary";
  /** children 只有圖示時要給：讀螢幕唸不出一個加號 */
  label?: string;
  /** 按鈕上要顯示的文字，例如「新增」。沒給就是純圖示（label 只給讀螢幕用） */
  text?: string;
  /** 進行中不給再按一次；連結形式（href）沒有這個狀態 */
  disabled?: boolean;
};

/** 主要動作，例如「新增書籍」「編輯」 */
export function ActionButton({
  children,
  href,
  onClick,
  tone = "primary",
  label,
  text,
  disabled,
}: ActionButtonProps) {
  // 有文字內容就用一般寬度的樣式；純圖示（沒有 text，只有給讀螢幕看的 label）才收窄成正方形
  const primary = text || !label ? styles.primary : styles.primaryIcon;
  const className = `${tone === "primary" ? primary : styles.secondary} ${disabled ? "opacity-50" : ""}`;
  const content = (
    <>
      {children}
      {text && <span>{text}</span>}
    </>
  );
  if (href) {
    return (
      <Link href={href} aria-label={label} title={label} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={className}
    >
      {content}
    </button>
  );
}
