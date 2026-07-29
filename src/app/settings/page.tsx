"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useSheetStore } from "@/store/useSheetStore";
import { SheetPicker } from "@/components/settings/SheetPicker";
import { InstapaperConnect } from "@/components/settings/InstapaperConnect";
import { CategoryManager } from "@/components/settings/CategoryManager";
import { EnrichButton } from "@/components/books/EnrichButton";
import { PageHeader } from "@/components/layout/PageHeader";

type SettingsTab = "connect" | "categories" | "maintenance";

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

      setSheet(id, name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "連接失敗");
    } finally {
      setVerifying(false);
    }
  }

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-3xl">
        <PageHeader title="設定" />
        <div className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">
          請先登入 Google 帳號
        </div>
      </div>
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

          <div className="border-t pt-4">
            <InstapaperConnect />
          </div>
        </div>
      ),
    },
    { key: "categories", label: "分類選項", node: <CategoryManager /> },
    {
      key: "maintenance",
      label: "資料維護",
      // 偶爾才會用到的維護動作，放這裡就好，別佔著書單頁的空間
      node: (
        <div>
          <p className="mb-3 text-xs text-gray-500">
            從網路查書名、作者、書封等資料，補進 Sheet 裡沒填的欄位。
            新增一批書之後跑一次就好。
          </p>
          <EnrichButton />
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto flex h-full min-h-0 max-w-3xl flex-col">
      <PageHeader
        title="設定"
        action={
          // 分頁切換：每個區塊各自塞得下一個畫面，不用整頁往下捲
          <div className="flex items-center gap-1 rounded-lg border p-1">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`rounded px-2.5 py-1.5 text-xs font-medium sm:text-sm ${
                  tab === t.key
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:bg-gray-100"
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
    </div>
  );
}
