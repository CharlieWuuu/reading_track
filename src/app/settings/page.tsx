"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useSheetStore } from "@/store/useSheetStore";
import { SheetPicker } from "@/components/settings/SheetPicker";
import { PageHeader } from "@/components/layout/PageHeader";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { sheetId, sheetName, setSheet } = useSheetStore();
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  async function handlePicked(id: string, name: string) {
    setVerifying(true);
    setError("");
    try {
      const res = await fetch("/api/sheet/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetId: id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "連接失敗");

      setSheet(id, name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "連接失敗");
    } finally {
      setVerifying(false);
    }
  }

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title="設定" />
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
          請先登入 Google 帳號
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="設定" />

      <div className="rounded-lg border bg-white p-5 space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">連接 Google Sheet</h3>
          <p className="mb-3 text-xs text-gray-500">
            先到{" "}
            <a
              href="https://sheets.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              sheets.google.com
            </a>{" "}
            建立一份空白試算表（不用自己加欄位），接著點下方按鈕選取它。
            這個 App 只能存取你選過的檔案，不會看到其他 Sheet。
          </p>

          <SheetPicker onSelect={handlePicked} />

          {verifying && <p className="mt-2 text-xs text-gray-500">連接中…</p>}
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

          {sheetId && !verifying && (
            <p className="mt-2 text-xs text-green-600">
              已連接：{sheetName || sheetId}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
