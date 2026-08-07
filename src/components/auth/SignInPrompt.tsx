"use client";

import { signIn } from "next-auth/react";

/**
 * 未登入時的整塊提示：整個框就是登入按鈕，按下去直接進 Google 的授權頁。
 *
 * 不做「進頁面自動轉走」——使用者在授權頁按取消回來會立刻又被送出去，
 * 等於進不了這一頁。留一下按鈕，動作一樣是一步。
 */
export function SignInPrompt({ text = "請先登入 Google 帳號" }: { text?: string }) {
  return (
    <button
      type="button"
      onClick={() => signIn("google")}
      className="flex w-full flex-col items-center gap-2 rounded-lg border bg-white p-8 text-center text-sm text-gray-500 hover:bg-gray-50"
    >
      <span>{text}</span>
      <span className="rounded bg-gray-900 px-3 py-1.5 text-sm font-medium text-white">
        使用 Google 登入
      </span>
    </button>
  );
}
