"use client";

import { usePathname, useSearchParams } from "next/navigation";

/** 現在這個畫面的網址，含參數——分頁與看法都在參數裡，掉了就回到別的畫面 */
export function useCurrentHref(): string {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}
