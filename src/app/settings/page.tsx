"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { AuthButton } from "@/components/auth/AuthButton";
import { SignInPrompt } from "@/components/auth/SignInPrompt";
import { EnrichButton } from "@/components/books/EnrichButton";
import { PageHeader } from "@/components/layout/PageHeader";
import { CategoryManager } from "@/components/settings/CategoryManager";
import { DataIssuesPanel } from "@/components/settings/DataIssuesPanel";
import { DisplaySettings } from "@/components/settings/DisplaySettings";
import { InstapaperConnect } from "@/components/settings/InstapaperConnect";
import { SheetPicker } from "@/components/settings/SheetPicker";
import { useSheetStore } from "@/store/useSheetStore";

type SettingsTab = "connect" | "categories" | "display" | "maintenance";

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>("connect");
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

      // Picker 沒回檔名時退回用 Sheet 自己的標題
      setSheet(id, name || data.title || id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "連接失敗");
    } finally {
      setVerifying(false);
    }
  }

  if (!session?.user) {
    return (
      <>
        <PageHeader title="設定" />
        <SignInPrompt />
      </>
    );
  }

  const tabs: Array<{ key: SettingsTab; label: string; node: React.ReactNode }> = [
    {
      key: "connect",
      label: "資料來源",
      node: (
        <div className="space-y-4">
          <div>
            <h3 className="mb-2 text-sm font-medium">連接 Google Sheet</h3>
            <p className="mb-3 text-xs text-gray-500">
              到{" "}
              <a
                href="https://sheets.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                sheets.google.com
              </a>{" "}
              建立一份空白試算表（欄位會自動建立），再點下方按鈕選取它。這個 app
              只能存取你選過的檔案。
            </p>

            <SheetPicker onSelect={handlePicked} />

            {verifying && <p className="mt-2 text-xs text-gray-500">連接中…</p>}
            {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

            {sheetId && !verifying && (
              <p className="mt-2 text-xs text-green-600">已連接：{sheetName || sheetId}</p>
            )}
          </div>

          <div className="border-t pt-4">
            <InstapaperConnect />
          </div>

          {/* 帳號從手機頂欄搬過來：頻率低，不值得一直佔著頂欄的位子 */}
          <div className="flex flex-col gap-2 border-t pt-4">
            <h3 className="text-sm font-medium">帳號</h3>
            <AuthButton />
          </div>
        </div>
      ),
    },
    { key: "categories", label: "分類選項", node: <CategoryManager /> },
    { key: "display", label: "顯示方式", node: <DisplaySettings /> },
    {
      key: "maintenance",
      label: "資料維護",
      // 偶爾才會用到的維護動作，放這裡就好，別佔著書單頁的空間
      node: (
        <div>
          <p className="mb-3 text-xs text-gray-500">
            從網路查書名、作者、書封等資料，補進 Sheet 裡沒填的欄位。 新增一批書之後跑一次就好。
          </p>
          <EnrichButton />

          <div className="mt-6 border-t pt-4">
            <DataIssuesPanel />
          </div>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="設定"
        action={
          // 手機放不下四個標籤，改成單行橫向捲動，不折成兩行把頁首撐高
          <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-lg border p-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`shrink-0 rounded px-2.5 py-1.5 text-xs font-medium whitespace-nowrap sm:text-sm ${
                  tab === t.key ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border bg-white p-4 md:p-5">
        {tabs.find((t) => t.key === tab)?.node}
      </div>
    </>
  );
}
