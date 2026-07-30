"use client";

import { useState } from "react";
import { useInstapaperStore } from "@/store/useInstapaperStore";

export function InstapaperConnect() {
  const { token, username, setAccess, disconnect } = useInstapaperStore();
  const [form, setForm] = useState({ username: "", password: "" });
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setConnecting(true);
    setError("");
    try {
      const res = await fetch("/api/instapaper/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "連接失敗");

      setAccess(data.token, data.tokenSecret, form.username);
      setForm({ username: "", password: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "連接失敗");
    } finally {
      setConnecting(false);
    }
  }

  if (token) {
    return (
      <div>
        <h3 className="mb-2 text-sm font-medium">Instapaper</h3>
        <p className="text-sm text-green-600">已連接：{username}</p>
        <button
          onClick={disconnect}
          className="mt-2 rounded border px-3 py-1.5 text-xs font-medium hover:bg-gray-100"
        >
          中斷連接
        </button>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium">Instapaper</h3>
      <p className="mb-3 text-xs text-gray-500">
        用來讀取已讀文章。密碼只用於換取存取權杖，不會被儲存。
      </p>
      {/* 兩欄並排，設定頁在手機上才不用捲 */}
      <form onSubmit={handleConnect} className="space-y-2 sm:grid sm:grid-cols-2 sm:gap-2 sm:space-y-0">
        <input
          type="text"
          placeholder="Instapaper 帳號（email）"
          value={form.username}
          onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
          className="w-full rounded border px-3 py-2 text-sm"
          required
        />
        <input
          type="password"
          placeholder="密碼"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          className="w-full rounded border px-3 py-2 text-sm"
          required
        />
        <button
          type="submit"
          disabled={connecting}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 sm:col-span-2 sm:justify-self-start"
        >
          {connecting ? "連接中…" : "連接 Instapaper"}
        </button>
        {error && <p className="text-xs text-red-600 sm:col-span-2">{error}</p>}
      </form>
    </div>
  );
}
