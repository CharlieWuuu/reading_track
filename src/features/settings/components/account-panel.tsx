"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { SignInPrompt } from "@/components/ui/sign-in-prompt";
import { PrivacyButton } from "@/features/settings/components/privacy-button";
import { clearLocalData } from "@/utils/clear-local-data";

const styles = {
  wrap: "flex max-w-md flex-col gap-6 mx-auto",
  row: "border-rule flex items-center gap-4 border-b pb-6",
  avatar: "h-14 w-14 rounded-full",
  blank:
    "bg-surface-sunken text-ink-muted flex h-14 w-14 items-center justify-center rounded-full text-lg",
  name: "font-serif text-item font-semibold",
  email: "text-meta text-ink-faint",
  unlock: "border-rule flex flex-wrap items-center gap-3 border-b pb-6",
  hint: "text-meta text-ink-faint",
  signOut:
    "rounded-control border-rule-strong hover:bg-control-bg hover:text-control-ink w-full border px-3 py-2 text-sm font-medium transition-colors",
  footer: "border-rule text-meta text-ink-faint flex items-center justify-between border-t pt-4",
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

      {/* 解鎖鍵：這是「我現在要不要看見私人內容」的個人操作，跟帳號本身同一層級。
          標哪些主題是私人的設定留在「私人項目」分頁 */}
      <div className={styles.unlock}>
        <PrivacyButton />
        <p className={styles.hint}>解鎖之後才看得到標了鎖的內容；關掉分頁會自動鎖回去。</p>
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
