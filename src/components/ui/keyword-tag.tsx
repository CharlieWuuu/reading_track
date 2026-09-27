"use client";

import Link from "next/link";
import { keywordHref } from "@/config/routes";

/**
 * 畫面上每一個關鍵字標籤。
 *
 * 全站只有這一個：書寫的時間軸、書籍與文章的詳細頁、卡片牆點到的字，
 * 點下去都是同一件事——進那個字的詳情頁，先看它是什麼，要改再按編輯。
 */
export function KeywordTag({ name, className }: { name: string; className?: string }) {
  return (
    <Link href={keywordHref(name)} className={className}>
      {name}
    </Link>
  );
}
