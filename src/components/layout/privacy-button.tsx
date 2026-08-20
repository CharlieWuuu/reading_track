"use client";

import { useState } from "react";
import { Lock, LockOpen } from "lucide-react";
import { useSWRConfig } from "swr";
import { Dialog } from "@/components/ui/dialog";
import { clearSWRCache } from "@/lib/swrCache";
import { usePrivacyStore } from "@/stores/use-privacy-store";
import { useSheetStore } from "@/stores/use-sheet-store";

const styles = {
  button:
    "flex h-8 items-center gap-1.5 rounded border border-gray-900 text-xs font-medium transition-colors hover:bg-gray-900 hover:text-white",
  form: "flex flex-col gap-3",
  hint: "text-xs text-gray-500",
  input: "w-full rounded border px-3 py-2 text-sm",
  actions: "flex items-center gap-2",
  submit:
    "rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50",
  link: "text-xs text-gray-500 hover:underline",
  error: "text-xs text-red-600",
};

/**
 * 顯示／隱藏私人項目。
 *
 * 鎖著的時候伺服器根本不會把那些列送過來（見 lib/privacy.ts），所以鎖上就等於
 * 那些書、文章、書寫在這個瀏覽器裡不存在——統計、月曆、關鍵字也一起乾淨。
 */
export function PrivacyButton({ compact = false }: { compact?: boolean }) {
  const { sheetId } = useSheetStore();
  const { token, unlock, lock } = usePrivacyStore();
  const { mutate } = useSWRConfig();
  const [open, setOpen] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [current, setCurrent] = useState("");
  const [setting, setSetting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const unlocked = Boolean(token);

  function close() {
    setOpen(false);
    setPasscode("");
    setCurrent("");
    setError("");
    setSetting(false);
  }

  async function handleLock() {
    lock();
    // 記憶體與 localStorage 的快取都清掉，剛才看過的私人資料不留在這台機器上
    clearSWRCache();
    await mutate(() => true, undefined, { revalidate: true });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sheetId) {
      setError("請先到「設定」頁面連接 Google Sheet");
      return;
    }

    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/privacy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sheetId,
          action: setting ? "set" : "verify",
          passcode,
          current,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "解鎖失敗");
      unlock(data.token);
      await mutate(() => true);
      close();
    } catch (err) {
      setError(err instanceof Error ? err.message : "解鎖失敗");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => (unlocked ? handleLock() : setOpen(true))}
        title={unlocked ? "隱藏私人項目" : "顯示私人項目"}
        aria-label={unlocked ? "隱藏私人項目" : "顯示私人項目"}
        className={`${styles.button} ${compact ? "w-8 justify-center" : "px-2"} ${
          unlocked ? "bg-gray-900 text-white" : ""
        }`}
      >
        {unlocked ? <LockOpen size={14} strokeWidth={1.5} /> : <Lock size={14} strokeWidth={1.5} />}
        {!compact && (unlocked ? "私人：顯示中" : "私人")}
      </button>

      {open && (
        <Dialog title={setting ? "設定私人密碼" : "顯示私人項目"} onClose={close}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <p className={styles.hint}>
              {setting
                ? "密碼的雜湊存在 Sheet 的「設定」分頁，換裝置也通用。它擋的是旁邊的人瞄一眼，不是加密——Sheet 本身打開就看得到內容。"
                : "解鎖之後才會載入標成私人的書籍、文章與書寫。關掉分頁會自動鎖回去。"}
            </p>

            {setting && (
              <input
                type="password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                placeholder="原本的密碼（第一次設定不用填）"
                className={styles.input}
              />
            )}
            <input
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder={setting ? "新密碼" : "密碼"}
              autoFocus
              className={styles.input}
            />

            {error && <p className={styles.error}>{error}</p>}

            <div className={styles.actions}>
              <button type="submit" disabled={busy || !passcode.trim()} className={styles.submit}>
                {busy ? "處理中…" : setting ? "設定密碼" : "解鎖"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setSetting((v) => !v);
                  setError("");
                }}
                className={styles.link}
              >
                {setting ? "回到解鎖" : "設定或修改密碼"}
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </>
  );
}
