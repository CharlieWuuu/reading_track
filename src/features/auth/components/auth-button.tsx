"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Spinner } from "@/components/ui/spinner";
import { activeNavKey, TOOL_ITEMS } from "@/config/nav";
import { settingsTabHref } from "@/config/routes";

const styles = {
  link: "hover:text-ink whitespace-nowrap",
  linkActive: "text-ink font-medium whitespace-nowrap",
  user: "flex items-center gap-2 whitespace-nowrap hover:text-ink",
};

/**
 * 報頭右上角。沒登入只有一顆登入鍵；登入後是統計／設定／帳號一排——
 * 這三個是後台與回顧，不是內容類型，跟側欄的三堆分開放。
 */
export function AuthButton() {
  const { data: session, status } = useSession();
  const current = activeNavKey(usePathname());

  if (status === "loading") {
    return <Spinner size={14} className="text-ink-faint" />;
  }

  if (!session?.user) {
    return (
      <button
        type="button"
        onClick={() => signIn("google")}
        className="bg-control-bg text-control-ink hover:bg-control-bg-hover text-ui px-3 py-1.5 font-medium"
      >
        用 Google 登入
      </button>
    );
  }

  const user = session.user;
  const label = user.name ?? user.email ?? "";

  return (
    <>
      {TOOL_ITEMS.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          aria-current={item.key === current ? "page" : undefined}
          className={item.key === current ? styles.linkActive : styles.link}
        >
          {item.label}
        </Link>
      ))}
      <Link href={settingsTabHref("account")} className={styles.user}>
        <span className="max-w-[8em] truncate">{label}</span>
      </Link>
    </>
  );
}
