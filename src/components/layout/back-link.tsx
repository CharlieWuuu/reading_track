"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

/**
 * 返回鍵：退回上一頁。
 *
 * 退回去的好處是狀態全都在——清單的篩選、搜尋、看法與捲動位置都是上一筆歷史的一部分，
 * 不用在每個清單連結上串一份 query 再讀回來。
 *
 * href 給的是這一頁在階層上的上一層，用在中鍵開新分頁與右鍵複製連結；
 * 直接開網址進來時沒有上一格可退，返回鍵就沒有反應，這個不特別處理。
 */
export function BackLink({ href, className }: { href: string; className?: string }) {
  const router = useRouter();

  return (
    <Link
      href={href}
      aria-label="返回"
      className={className}
      onClick={(e) => {
        e.preventDefault();
        router.back();
      }}
    >
      <ChevronLeft size={20} strokeWidth={1.5} aria-hidden />
    </Link>
  );
}
