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
};

/** 主要動作，例如「新增書籍」「編輯」 */
export function ActionButton({
  children,
  href,
  onClick,
  tone = "primary",
  label,
  text,
}: ActionButtonProps) {
  // 有文字就是純文字連結（頁首那排的長相），用強調色跟旁邊的中性字分開；沒文字才是圖示按鈕
  const primary = label ? styles.primaryIcon : styles.primary;
  const className = text
    ? `${styles.link} ${styles.linkAccent}`
    : tone === "primary"
      ? primary
      : styles.secondary;
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
    <button type="button" onClick={onClick} aria-label={label} title={label} className={className}>
      {content}
    </button>
  );
}
