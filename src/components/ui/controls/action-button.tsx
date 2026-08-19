"use client";

import Link from "next/link";
import { styles } from "@/components/ui/controls/styles";

type ActionButtonProps = {
  children: React.ReactNode;
  /** 給了就是連結，沒給就是按鈕 */
  href?: string;
  onClick?: () => void;
  tone?: "primary" | "secondary";
};

/** 主要動作，例如「新增書籍」「編輯」 */
export function ActionButton({ children, href, onClick, tone = "primary" }: ActionButtonProps) {
  const className = tone === "primary" ? styles.primary : styles.secondary;
  if (href) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {children}
    </button>
  );
}
