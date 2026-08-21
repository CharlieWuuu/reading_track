"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useSheetStore } from "@/stores/use-sheet-store";

type RecordFormOptions<P> = {
  /** API 路徑上的那一段，例如 "books"；也決定 POST 的 body 長什麼樣 */
  resource: "books" | "articles" | "writings";
  /** POST 時包住整筆資料的那個鍵，例如 { sheetId, book: {...} } */
  bodyKey: "book" | "article" | "writings";
  /** 編輯既有的那一筆時給編號；新增時是空字串 */
  existingId: string;
  /** 現在這一刻要送出去的內容 */
  payload: P;
  /** 存完之後要去哪 */
  redirectTo: string;
  /** 刪完之後要去哪；書籍存完是回它的詳細頁，但那一頁已經沒了，所以要回清單 */
  deleteRedirectTo?: string;
  /** 重新抓清單；刪除時可以傳自己的更新函式，見 mutateOnDelete */
  mutate: () => Promise<unknown>;
  /** 沒填必填欄位時回一句話，回了就不送出 */
  validate: () => string | undefined;
  /** 存好之後還要寫別的東西（書籍的佳句與單字靠書籍編號認人，得等書存完） */
  onSaved?: (id: string) => Promise<void>;
};

/** 自動存檔沒看回應的話，POST 失敗會被當成成功，之後就一直 PATCH 一個不存在的編號 */
const failIfNotOk = (message: string, mutate: () => Promise<unknown>) => async (res: Response) => {
  if (!res.ok) throw new Error(message);
  return mutate();
};

/**
 * 書籍、文章、書寫三張表單共用的存檔骨架。
 *
 * 三張表本來各寫一份一模一樣的東西：驗證、POST 或 PATCH、重抓清單、跳回列表、
 * 出錯時把訊息放在同一個地方、刪除前先標記不要被自動存檔救回來。差別只有
 * 「叫什麼名字」跟「存完要不要多寫幾列」。
 *
 * 自動存檔包在裡面：新增頁自動存過一次就記住編號，按下儲存時會認得那個編號，
 * 所以是改同一筆而不是再開一筆。
 */
export function useRecordForm<P>({
  resource,
  bodyKey,
  existingId,
  payload,
  redirectTo,
  deleteRedirectTo,
  mutate,
  validate,
  onSaved,
}: RecordFormOptions<P>) {
  const router = useRouter();
  const { sheetId } = useSheetStore();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const autoSave = useAutoSave({
    ready: Boolean(sheetId && !validate()),
    existingId,
    payload,
    create: (id, body) =>
      fetch(`/api/${resource}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetId, [bodyKey]: { id, ...body } }),
        keepalive: true,
      }).then(failIfNotOk("自動存檔失敗", mutate)),
    update: (id, body) =>
      fetch(`/api/${resource}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetId, patch: body }),
        keepalive: true,
      }).then(failIfNotOk("自動存檔失敗", mutate)),
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    if (!sheetId) {
      setError("請先到「設定」頁面連接 Google Sheet");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      // 自動存檔可能已經先建好這一筆了，那按下儲存就是改它，不是再開一筆
      const id = existingId || autoSave.savedIdRef.current || autoSave.newId;
      const isNew = !existingId && !autoSave.savedIdRef.current;
      const res = isNew
        ? await fetch(`/api/${resource}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sheetId, [bodyKey]: { id, ...payload } }),
          })
        : await fetch(`/api/${resource}/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sheetId, patch: payload }),
          });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "儲存失敗");

      await onSaved?.(id);
      autoSave.markSaved(payload, id);
      await mutate();
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!existingId || !sheetId) return;
    // 刪完會離開這一頁，卸載時的自動存檔不能把它救回來
    autoSave.markDeleted();

    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(
        `/api/${resource}/${existingId}?sheetId=${encodeURIComponent(sheetId)}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "刪除失敗");
      }
      await mutate();
      router.push(deleteRedirectTo ?? redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "刪除失敗");
      setSubmitting(false);
    }
  }

  /**
   * 點關鍵字跳到那個字的編輯頁。
   *
   * 從「新增」跳走時先讓這一筆落地，並把網址換成它的編輯頁——
   * 不然按上一頁會回到空的新增頁，再存一次就變成兩筆。
   */
  async function openRecordThen(go: (backHref: string) => void, fallbackHref: string) {
    const isNew = !existingId && !autoSave.savedIdRef.current;
    await autoSave.save();
    const id = autoSave.savedIdRef.current;
    const editHref = `/${resource}/${id}/edit`;
    if (isNew && id) router.replace(editHref);
    go(isNew && id ? editHref : fallbackHref);
  }

  return { submitting, error, setError, handleSubmit, handleDelete, openRecordThen };
}
