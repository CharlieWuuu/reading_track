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
};

/** 主要動作，例如「新增書籍」「編輯」 */
export function ActionButton({
  children,
  href,
  onClick,
  tone = "primary",
  label,
}: ActionButtonProps) {
  // 有 label 就代表 children 是圖示，用方形那一版
  const primary = label ? styles.primaryIcon : styles.primary;
  const className = tone === "primary" ? primary : styles.secondary;
  if (href) {
    return (
      <Link href={href} aria-label={label} title={label} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className={className}>
      {children}
    </button>
  );
}
