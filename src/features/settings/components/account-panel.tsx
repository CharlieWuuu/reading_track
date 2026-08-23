"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { SignInPrompt } from "@/components/ui/sign-in-prompt";
import { clearLocalData } from "@/utils/clear-local-data";

const styles = {
  wrap: "flex flex-col gap-6",
  row: "flex items-center gap-4",
  avatar: "h-14 w-14 rounded-full",
  blank:
    "flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-lg text-gray-600",
  name: "font-medium",
  email: "text-sm text-gray-500",
  signOut: "rounded-control w-full border px-3 py-2 text-sm font-medium hover:bg-gray-100",
  footer: "flex items-center justify-between border-t pt-4 text-xs text-gray-400",
};

/** 原本的 /profile：頭像、登出、版本號。內容太少，撐不起一條路由 */
export function AccountPanel() {
  const { data: session } = useSession();
  if (!session?.user) return <SignInPrompt />;

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        {session.user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={session.user.image} alt="" className={styles.avatar} />
        ) : (
          <div className={styles.blank}>
            {(session.user.name ?? session.user.email ?? "?").slice(0, 1)}
          </div>
        )}
        <div>
          <p className={styles.name}>{session.user.name}</p>
          <p className={styles.email}>{session.user.email}</p>
        </div>
      </div>

      <button
        onClick={() => {
          clearLocalData();
          signOut();
        }}
        className={styles.signOut}
      >
        登出
      </button>

      {/* 裝成 app 之後畫面會被快取，出問題時要看得出跑的是哪一版 */}
      <div className={styles.footer}>
        <span>版本 {process.env.NEXT_PUBLIC_APP_VERSION ?? "dev"}</span>
        <Link href="/privacy" className="underline">
          隱私權政策
        </Link>
      </div>
    </div>
  );
}
