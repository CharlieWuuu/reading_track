"use client";

import { signOut, useSession } from "next-auth/react";
import { PageHeader } from "@/components/layout/PageHeader";

export default function ProfilePage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-md">
        <PageHeader title="個人資訊" />
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
          載入中…
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-md">
        <PageHeader title="個人資訊" />
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
          請先登入 Google 帳號
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <PageHeader title="個人資訊" />

      <div className="rounded-lg border bg-white p-5">
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
          className="mt-6 w-full rounded border px-3 py-2 text-sm font-medium hover:bg-gray-100"
        >
          登出
        </button>
      </div>
    </div>
  );
}
