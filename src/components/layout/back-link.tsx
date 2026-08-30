"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

/**
 * 返回鍵：在站內有上一頁就真的退回去，沒有才走 href。
 *
 * 退回去的好處是狀態全都在——清單的篩選、搜尋、看法與捲動位置都是上一筆歷史的一部分，
 * 不用在每個清單連結上串一份 query 再讀回來。
 *
 * 但不能只有 back()：分享連結、書籤、重新整理後直接進來時，上一頁是別人的網站，
 * 退回去等於把人送出去。所以 href 一定要給，它是這種入口唯一的退路。
 *
 * 判斷用 App Router 寫在 history.state 上的 idx：它是「這一次造訪的第幾頁」，
 * 0 就代表這一頁是入口。history.length 不行，那個把上一個網站的頁數也算進去。
 */
function hasHistoryInApp(): boolean {
  if (typeof window === "undefined") return false;
  const idx = (window.history.state as { idx?: number } | null)?.idx;
  return typeof idx === "number" && idx > 0;
}

export function BackLink({ href, className }: { href: string; className?: string }) {
  const router = useRouter();

  return (
    <Link
      href={href}
      aria-label="返回"
      className={className}
      onClick={(e) => {
        if (!hasHistoryInApp()) return;
        e.preventDefault();
        router.back();
      }}
    >
      <ChevronLeft size={20} strokeWidth={1.5} aria-hidden />
    </Link>
  );
}
