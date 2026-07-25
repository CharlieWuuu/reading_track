"use client";

import { useEffect } from "react";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";

export function AuthButton() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      signIn("google");
    }
  }, [session?.error]);

  if (status === "loading") {
    return <span className="text-sm text-gray-400">載入中…</span>;
  }

  if (session?.user) {
    return (
      <Link
        href="/profile"
        className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-gray-100"
      >
        {session.user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={session.user.image}
            alt=""
            className="h-8 w-8 shrink-0 rounded-full"
          />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs text-gray-600">
            {(session.user.name ?? session.user.email ?? "?").slice(0, 1)}
          </div>
        )}
        <span className="truncate text-gray-700">
          {session.user.name ?? session.user.email}
        </span>
      </Link>
    );
  }

  return (
    <button
      onClick={() => signIn("google")}
      className="w-full rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
    >
      使用 Google 登入
    </button>
  );
}
