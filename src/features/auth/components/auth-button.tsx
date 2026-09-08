"use client";

import { signIn, useSession } from "next-auth/react";
import { Spinner } from "@/components/ui/spinner";

/**
 * 報頭右上角只在沒登入時有東西：一顆登入鍵。
 * 登入後身分與設定都在側欄底部的工具區，報頭留白。
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

  // 登入後的身分與設定在側欄底部，報頭右上就空著
  return null;
}
