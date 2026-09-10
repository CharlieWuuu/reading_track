"use client";

import { useState } from "react";

/**
 * 表格列的 inline 編輯：一次只有一列在編，點「編輯」進入、存檔或取消退出。
 *
 * 大部分資源走 /api/<resource>/[id]，body 包成 { patch }；catalog 那條通用路
 * 是 { values }（見 app/api/catalog/[id]/route.ts）。兩種只差 body 的包法，
 * 用 bodyKey 切換，不用另外寫一支 hook。
 */
export function useInlineEdit<T>(
  resource: string,
  onSaved: () => unknown,
  options?: { bodyKey?: "patch" | "values" },
) {
  const bodyKey = options?.bodyKey ?? "patch";
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(id: string, patch: Partial<T>) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/${resource}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [bodyKey]: patch }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "儲存失敗");
      }
      await onSaved();
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSaving(false);
    }
  }

  return {
    editingId,
    startEdit: (id: string) => {
      setEditingId(id);
      setError("");
    },
    cancelEdit: () => {
      setEditingId(null);
      setError("");
    },
    save,
    saving,
    error,
  };
}
