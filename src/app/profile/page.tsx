"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { PageMessage, PageShell } from "@/components/layout/PageShell";
import { SignInPrompt } from "@/components/auth/SignInPrompt";

export default function ProfilePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <PageShell title="個人資訊" width="narrow">
        <PageMessage>載入中…</PageMessage>
      </PageShell>
    );
  }

  if (!session?.user) {
    return (
      <PageShell title="個人資訊" width="narrow">
        <SignInPrompt />
      </PageShell>
    );
  }

  return (
    <PageShell title="個人資訊" width="narrow">
      <div className="flex w-full flex-col gap-6 rounded-lg border bg-white p-5">
        <div className="flex items-center gap-4">
          {session.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.user.image}
              alt=""
              className="h-14 w-14 rounded-full"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 text-lg text-gray-600">
              {(session.user.name ?? session.user.email ?? "?").slice(0, 1)}
            </div>
          )}
          <div>
            <p className="font-medium">{session.user.name}</p>
            <p className="text-sm text-gray-500">{session.user.email}</p>
          </div>
        </div>

        <button
          onClick={() => signOut()}
          className="w-full rounded border px-3 py-2 text-sm font-medium hover:bg-gray-100"
        >
          登出
        </button>
      </div>

      {/* 裝成 app 之後畫面會被快取，出問題時要看得出跑的是哪一版 */}
      <div className="flex items-center justify-between px-1 text-xs text-gray-400">
        <span>版本 {process.env.NEXT_PUBLIC_APP_VERSION ?? "dev"}</span>
        <Link href="/privacy" className="underline">
          隱私權政策
        </Link>
      </div>
    </PageShell>
  );
}
