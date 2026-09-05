"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

/** 帳密登入。沒有註冊入口，帳號由 scripts/create-user 建 */
export function CredentialsForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");

    const result = await signIn("credentials", { email, password, redirect: false });
    if (result?.error) setError("帳號或密碼不對");
    else window.location.reload(); // session 換人了，整頁重來最乾淨

    setPending(false);
  }

  return (
    <form onSubmit={submit} className="flex w-full flex-col gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email"
        autoComplete="username"
        className="rounded-control border px-3 py-1.5 text-sm"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="密碼"
        autoComplete="current-password"
        className="rounded-control border px-3 py-1.5 text-sm"
      />
      {error && <span className="text-sm text-red-600">{error}</span>}
      <button
        type="submit"
        disabled={pending || !email || !password}
        className="rounded-control bg-control-bg text-control-ink px-3 py-1.5 text-sm font-medium disabled:opacity-50"
      >
        {pending ? "登入中…" : "登入"}
      </button>
    </form>
  );
}
