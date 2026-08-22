"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { PageMessage } from "@/components/layout/page-message";
import { SignInPrompt } from "@/components/ui/sign-in-prompt";
import { clearLocalData } from "@/utils/clear-local-data";

export default function ProfilePage() {
  const { data: session, status } = useSession();

  // 頁首三個分支都一樣，畫一次就好；變的只有底下那一塊
  return (
    <>
      <PageHeader title="個人資訊" />
      {status === "loading" ? (
        <PageMessage>載入中…</PageMessage>
      ) : !session?.user ? (
        <SignInPrompt />
      ) : (
        <PageBody>
          <div className="rounded-surface flex w-full flex-col gap-6 bg-white p-5">
            <div className="flex items-center gap-4">
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt="" className="h-14 w-14 rounded-full" />
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
              onClick={() => {
                clearLocalData();
                signOut();
              }}
              className="rounded-control w-full border px-3 py-2 text-sm font-medium hover:bg-gray-100"
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
        </PageBody>
      )}
    </>
  );
}
