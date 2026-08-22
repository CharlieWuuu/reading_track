"use client";

import { signIn } from "next-auth/react";

/** 整個框就是登入按鈕；不自動轉走，不然在授權頁按取消回來會又被送出去 */
export function SignInPrompt({ text = "請先登入 Google 帳號" }: { text?: string }) {
  return (
    <button
      type="button"
      onClick={() => signIn("google")}
      className="rounded-surface flex w-full flex-col items-center gap-2 bg-white p-8 text-center text-sm text-gray-500 hover:bg-gray-50"
    >
      <span>{text}</span>
      <span className="rounded-control bg-gray-900 px-3 py-1.5 text-sm font-medium text-white">
        使用 Google 登入
      </span>
    </button>
  );
}
