"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SignInPrompt } from "@/components/ui/sign-in-prompt";

function Login() {
  const callbackUrl = useSearchParams().get("callbackUrl") ?? "/";

  return (
    <div className="flex min-h-full flex-1 items-center justify-center">
      <SignInPrompt text="登入 Archivum" callbackUrl={callbackUrl} />
    </div>
  );
}

/** 讀網址參數的元件要有 Suspense 邊界，靜態預先產生才不會失敗 */
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <Login />
    </Suspense>
  );
}
