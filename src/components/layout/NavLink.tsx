"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { isPagingMode } from "@/store/useBookViewStore";

type Props = {
  href: string;
  className?: string;
  title?: string;
  "aria-current"?: "page";
  children: React.ReactNode;
};

/**
 * 導覽連結。把目前網址上的 `?mode=` 帶到下一頁去——網址參數不會自己跟著跳頁，
 * 點 /articles 就只是 /articles。
 *
 * 取的是「目前網址上的值」而不是設定值：這樣分享出去的連結，或是臨時在網址上
 * 改過的瀏覽方式，切頁之後還在。網址沒帶就不補，交給那一頁自己依設定決定。
 */
function WithMode({ href, ...rest }: Props) {
  const mode = useSearchParams().get("mode");
  const next = isPagingMode(mode)
    ? `${href}${href.includes("?") ? "&" : "?"}mode=${mode}`
    : href;
  return <Link href={next} {...rest} />;
}

export function NavLink(props: Props) {
  // useSearchParams 在靜態預先產生時需要 Suspense 邊界；
  // fallback 就是沒帶參數的同一顆連結，所以不會有閃動或版面跳動
  return (
    <Suspense fallback={<Link href={props.href} {...propsWithoutHref(props)} />}>
      <WithMode {...props} />
    </Suspense>
  );
}

function propsWithoutHref(props: Props) {
  const rest = { ...props } as Partial<Props>;
  delete rest.href;
  return rest;
}
