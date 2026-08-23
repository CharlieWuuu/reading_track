"use client";

import { useState } from "react";
import { verifySheet } from "@/features/settings/api/verify-sheet";
import { PrivacyButton } from "@/features/settings/components/privacy-button";
import { SheetPicker } from "@/features/settings/components/sheet-picker";
import { useSheetStore } from "@/stores/use-sheet-store";

const styles = {
  wrap: "space-y-4",
  heading: "text-sm font-medium",
  hint: "text-xs text-gray-500",
  block: "flex flex-col gap-2 border-t pt-4",
};

export function SheetConnectPanel() {
  const { sheetId, sheetName, setSheet } = useSheetStore();
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  async function handlePicked(id: string, name: string) {
    setVerifying(true);
    setError("");
    try {
      const data = await verifySheet(id);
      // Picker 沒回檔名時退回用 Sheet 自己的標題
      setSheet(id, name || data.title || id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "連接失敗");
    } finally {
      setVerifying(false);
    }
  }

  return (
    <div className={styles.wrap}>
      <div>
        <h3 className={`mb-2 ${styles.heading}`}>連接 Google Sheet</h3>
        <p className={`mb-3 ${styles.hint}`}>
          到{" "}
          <a
            href="https://sheets.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            sheets.google.com
          </a>{" "}
          建立一份空白試算表（欄位會自動建立），再點下方按鈕選取它。這個 app 只能存取你選過的檔案。
        </p>

        <SheetPicker onSelect={handlePicked} />

        {verifying && <p className="mt-2 text-xs text-gray-500">連接中…</p>}
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        {sheetId && !verifying && (
          <p className="mt-2 text-xs text-green-600">已連接：{sheetName || sheetId}</p>
        )}
      </div>

      {/* 手機沒有側欄，私人項目的開關也要在設定裡找得到 */}
      <div className={`items-start ${styles.block}`}>
        <h3 className={styles.heading}>私人項目</h3>
        <p className={styles.hint}>
          標成私人的書籍、文章與書寫，沒解鎖時伺服器不會送到這台裝置上。關掉分頁會自動鎖回去。
        </p>
        <PrivacyButton />
      </div>
    </div>
  );
}
