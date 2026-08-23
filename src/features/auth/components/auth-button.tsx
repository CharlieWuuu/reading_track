"use client";

import Link from "next/link";
import { useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { Spinner } from "@/components/ui/spinner";
import { useSidebarStore } from "@/stores/use-sidebar-store";

/** 側欄收合時只顯示頭像；收合狀態直接讀 store，免得要跨 server/client 邊界傳 */
export function AuthButton() {
  const { data: session, status } = useSession();
  const compact = useSidebarStore((s) => s.collapsed);

  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      signIn("google");
    }
  }, [session?.error]);

  if (status === "loading") {
    return <Spinner size={14} className="text-gray-400" />;
  }

  if (session?.user) {
    return (
      <Link
        href="/profile"
        className="rounded-control flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-gray-100"
      >
        {session.user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={session.user.image} alt="" className="h-8 w-8 shrink-0 rounded-full" />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-600">
            {(session.user.name ?? session.user.email ?? "?").slice(0, 1)}
          </div>
        )}
        {!compact && (
          <span className="truncate text-gray-700">{session.user.name ?? session.user.email}</span>
        )}
      </Link>
    );
  }

  return (
    <button
      onClick={() => signIn("google")}
      className={`rounded-control bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700 ${
        compact ? "text-xs whitespace-nowrap" : "w-full"
      }`}
    >
      {compact ? "登入" : "使用 Google 登入"}
    </button>
  );
}
