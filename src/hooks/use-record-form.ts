"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ITEM_KEYS, Resource } from "@/config/item-keys";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useSheetStore } from "@/stores/use-sheet-store";

type RecordFormOptions<P> = {
  resource: Resource; // API 路徑上的那一段，例如 "books"
  existingId: string; // 新增時是空字串
  payload: P;
  redirectTo: string; // 刪完之後要去哪
  editHref: (id: string) => string; // 用 config/routes 的，頁面路徑跟 API 路徑是兩套
  deleteRedirectTo?: string; // 刪完不能回這一筆的詳細頁，那一頁已經沒了
  mutate: () => Promise<unknown>;
  validate: () => string | undefined; // 回一句話就不送出
  onSaved?: (id: string) => Promise<void>; // 佳句與單字靠編號認人，得等這一筆存完
};

/** 自動存檔不看回應，POST 失敗會被當成成功，之後一直 PATCH 不存在的編號 */
const failIfNotOk = (message: string, mutate: () => Promise<unknown>) => async (res: Response) => {
  if (!res.ok) throw new Error(message);
  return mutate();
};

/**
 * 書籍、文章、書寫三張表單共用的存檔骨架。
 *
 * 自動存檔包在裡面：新增頁自動存過一次就記住編號，按下儲存是改同一筆，不會變兩筆。
 */
export function useRecordForm<P>({
  resource,
  existingId,
  payload,
  redirectTo,
  editHref,
  deleteRedirectTo,
  mutate,
  validate,
  onSaved,
}: RecordFormOptions<P>) {
  const bodyKey = ITEM_KEYS[resource];
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
      // 自動存檔可能已經建好這一筆，那按下儲存是改它
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
      router.back(); // 存完就是離開，跟按返回鍵同一件事
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!existingId || !sheetId) return;
    autoSave.markDeleted(); // 不然卸載時的自動存檔會把它救回來

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
   * 先讓這一筆落地，再跳去別頁。
   *
   * 從「新增」跳走時網址要換成編輯頁，不然按上一頁會回到空的新增頁，再存一次就兩筆。
   */
  async function openRecordThen(go: (backHref: string) => void, fallbackHref: string) {
    const isNew = !existingId && !autoSave.savedIdRef.current;
    await autoSave.save();
    const id = autoSave.savedIdRef.current;
    const href = id ? editHref(id) : "";
    if (isNew && id) router.replace(href);
    go(isNew && id ? href : fallbackHref);
  }

  return { submitting, error, setError, handleSubmit, handleDelete, openRecordThen };
}
