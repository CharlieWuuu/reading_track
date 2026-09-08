"use client";

import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { Spinner } from "@/components/ui/spinner";
import { settingsTabHref } from "@/config/routes";

/**
 * 報頭右上角。登入後是「設定 ＋ 頭像」，沒登入只有一顆登入鍵——
 * 設定頁沒有資料可設，登入前不出現。
 */
export function AuthButton() {
  const { data: session, status } = useSession();

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

  const label = session.user.name ?? session.user.email ?? "?";

  return (
    <>
      <Link href="/settings" className="hover:text-ink whitespace-nowrap">
        設定
      </Link>
      <Link
        href={settingsTabHref("account")}
        className="hover:text-ink flex items-center gap-2 whitespace-nowrap"
      >
        {session.user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={session.user.image} alt="" className="h-6 w-6 shrink-0 rounded-full" />
        ) : (
          <span className="bg-rule text-ink-muted flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
            {label.slice(0, 1)}
          </span>
        )}
        <span className="max-w-[8em] truncate">{label}</span>
      </Link>
    </>
  );
}
