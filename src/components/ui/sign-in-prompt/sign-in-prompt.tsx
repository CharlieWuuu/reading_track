"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { CredentialsForm } from "./credentials-form";

/** Google 按鈕不自動轉走：在授權頁按取消回來會又被送出去 */
export function SignInPrompt({ text = "請先登入" }: { text?: string }) {
  const [withPassword, setWithPassword] = useState(false);

  return (
    <div className="rounded-surface flex w-full flex-col items-center gap-3 border bg-white p-8 text-center text-sm text-gray-500">
      <span>{text}</span>

      {withPassword ? (
        <div className="w-full max-w-xs">
          <CredentialsForm />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => signIn("google")}
          className="rounded-control bg-control-bg text-control-ink px-3 py-1.5 text-sm font-medium"
        >
          使用 Google 登入
        </button>
      )}

      <button
        type="button"
        onClick={() => setWithPassword((on) => !on)}
        className="text-xs text-gray-400 underline"
      >
        {withPassword ? "改用 Google 登入" : "用帳號密碼登入"}
      </button>
    </div>
  );
}
