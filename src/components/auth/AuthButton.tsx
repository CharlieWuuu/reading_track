"use client";

import { useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

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
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-600">{session.user.email}</span>
        <button
          onClick={() => signOut()}
          className="rounded border px-3 py-1.5 font-medium hover:bg-gray-100"
        >
          登出
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn("google")}
      className="rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-700"
    >
      使用 Google 登入
    </button>
  );
}
