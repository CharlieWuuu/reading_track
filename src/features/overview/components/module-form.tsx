"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ContentLinkInput } from "@/components/ui/content-link-input";
import { Field } from "@/components/ui/field";
import { FormActions } from "@/components/ui/form-actions";
import { PrivateToggle } from "@/components/ui/private-toggle/private-toggle";
import { kindHref } from "@/config/kind-routes";
import { FieldDef } from "@/config/record-fields";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useContentLinks } from "@/hooks/use-content-links";
import { Kind } from "@/lib/db/queries/kinds";
import { scrapeUrl } from "@/lib/scrape-url";
import type { Linkable } from "@/types/record";
import { fieldsOf, FormModule, resolveFormModules } from "@/utils/record-form";

/**
 * 照類型勾的模組畫出來的表單。
 *
 * 一套渲染器服務所有類型——欄位不是寫死的，是模組展開來的。沒勾的模組不留空位，
 * 所以「旅遊」不會出現「頁數」，「書籍」不會出現「維基連結」。
 *
 * 一個模組可能對到好幾欄（狀態＝開始＋結束），標籤掛在模組上，
 * 所以多欄的模組第一欄用模組名，其餘用欄位自己的預設名。
 */

const INPUT_TYPE: Partial<Record<FieldDef["type"], string>> = {
  date: "date",
  number: "number",
  url: "url",
  longText: "textarea", // 內文、例句這種，畫成單行根本寫不完
};

function ModuleFields({
  module,
  values,
  onChange,
  onUrlPaste,
}: {
  module: FormModule;
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  /** 貼進「外部連結」欄的訊號，抓取器接不接看類型有沒有這個欄位 */
  onUrlPaste?: (url: string) => void;
}) {
  const fields = fieldsOf([module]);

  return (
    <>
      {fields.map((field, index) =>
        // 開關不是輸入框：flag 走勾選，畫成 input 會叫人自己打「是」
        field.type === "flag" ? (
          <PrivateToggle
            key={field.key}
            label={index === 0 ? module.label : field.defaultLabel}
            value={values[field.key] ?? ""}
            onChange={(value) => onChange(field.key, value)}
          />
        ) : (
          <Field
            key={field.key}
            label={index === 0 ? module.label : field.defaultLabel}
            type={INPUT_TYPE[field.type] ?? "text"}
            value={values[field.key] ?? ""}
            onChange={(value) => onChange(field.key, value)}
            onPaste={field.key === "sourceUrl" ? onUrlPaste : undefined}
          />
        ),
      )}
    </>
  );
}

/** 給了 recordId 就是編輯，沒給就是新增。兩者畫出來的欄位完全一樣 */
export function ModuleForm({
  kind,
  recordId,
  initial,
}: {
  kind: Kind;
  recordId?: string;
  initial?: Record<string, string>;
}) {
  const router = useRouter();
  /**
   * 新增時日期預設今天：記一筆的當下就是那一天，要改再改。
   *
   * 只補新增（沒有 recordId）那條，編輯既有的不動——那一筆的日期是它自己的事。
   */
  const [values, setValues] = useState<Record<string, string>>(() => {
    if (initial) return initial;
    const today = new Date().toISOString().slice(0, 10);
    // 只補「單一日期」那個模組。進行中的起訖日不補——還沒讀完就標成今天讀完了
    const single = resolveFormModules(kind.modules).find((module) => module.key === "date");
    return single ? Object.fromEntries(fieldsOf([single]).map((f) => [f.key, today])) : {};
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const [fetching, setFetching] = useState(false);
  // 新增頁自動存過之後的編號。站內關聯要有編號才連得起來
  const [savedId, setSavedId] = useState("");
  const [fetchNote, setFetchNote] = useState("");

  const modules = resolveFormModules(kind.modules);
  const fields = fieldsOf(modules);
  // 關聯模組共用一格，標籤就用勾到的那幾個的名字——只勾出處叫「出處」，
  // 兩個都勾叫「出處與關鍵字」，使用者才知道這一格該放什麼
  const linkLabel = modules
    .filter((module) => module.links)
    .map((module) => module.label)
    .join("與");
  const set = (key: string, value: string) => setValues((v) => ({ ...v, [key]: value }));

  /**
   * 貼上外部連結時帶入標題與作者。用的是通用的 OG／JSON-LD 剖析器，不是
   * 各平台專用的書籍爬蟲——自訂類型沒有專屬剖析器，能拿到多少算多少。
   * 只補空欄位：手動改過的內容比抓回來的可信。
   */
  const canScrape =
    fields.some((f) => f.key === "sourceUrl") && fields.some((f) => f.key === "title");

  async function handleUrlPaste(url: string) {
    const trimmed = url.trim();
    if (!trimmed || !canScrape) return;

    setFetching(true);
    setFetchNote("");
    try {
      const found = await scrapeUrl(trimmed);
      let filled = 0;
      setValues((v) => {
        const next: Record<string, string> = { ...v, sourceUrl: trimmed };
        if (found.title && !next.title?.trim()) {
          next.title = found.title;
          filled += 1;
        }
        if (found.author && !next.creator?.trim()) {
          next.creator = found.author;
          filled += 1;
        }
        return next;
      });
      setFetchNote(filled ? `補上 ${filled} 個欄位` : "沒有可補的欄位");
    } catch (err) {
      setFetchNote(err instanceof Error ? err.message : "抓取失敗");
    } finally {
      setFetching(false);
    }
  }

  async function request(url: string, method: string, body: object, fallback: string) {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? fallback);
    return data as { id?: string };
  }

  /**
   * 離開頁面時自動存檔，跟書籍／文章／書寫那三張表單同一套——寫到一半點側欄
   * 跳走，內容不該就這樣不見。
   *
   * 新增這一筆的編號由伺服器給，所以 create 拿回傳的 id 回填，之後都是改同一筆。
   */
  const autoSave = useAutoSave({
    ready: Boolean(values.title?.trim() || values.name?.trim() || values.body?.trim()),
    existingId: recordId ?? "",
    payload: values,
    create: async (_id, payload) => {
      const data = await request(
        `/api/kinds/${kind.id}/records`,
        "POST",
        { values: payload },
        "新增失敗",
      );
      // 自動存檔先建了那筆，選好的關聯這時就補得上去，不用等按儲存
      if (data.id) {
        await flushPending(data.id);
        setPending([]);
        setSavedId(data.id);
      }
      return data.id; // 編號由伺服器產，回傳給 hook 記住
    },
    update: (id, payload) =>
      request(`/api/catalog/${id}`, "PATCH", { values: payload }, "儲存失敗"),
  });

  async function send(url: string, method: string, body: object, fallback: string) {
    setSaving(true);
    setError(undefined);
    try {
      const data = await request(url, method, body, fallback);
      autoSave.markSaved(values, data.id);
      if (data.id) await flushPending(data.id);
      // 直接開網址進來時沒有上一格可退，回這一種的清單
      if (window.history.length > 1) router.back();
      else router.replace(kindHref(kind.group, kind.slug));
    } catch (err) {
      setError(err instanceof Error ? err.message : fallback);
      setSaving(false);
    }
  }

  const save = () => {
    const id = recordId ?? autoSave.savedIdRef.current;
    return id
      ? send(`/api/catalog/${id}`, "PATCH", { values }, "儲存失敗")
      : send(`/api/kinds/${kind.id}/records`, "POST", { values }, "新增失敗");
  };

  const remove = () => {
    autoSave.markDeleted();
    return send(`/api/catalog/${recordId}`, "DELETE", {}, "刪除失敗");
  };

  /**
   * 站內關聯要有編號才存得起來，但新增中的那筆還沒有。
   *
   * 所以先收在這裡，等存檔拿到編號再一次送出——選的當下就看得到，
   * 不用先存一次再回來連。已經有編號的（編輯、或自動存檔給過了）直接走 hook。
   */
  const linkId = recordId || savedId;
  const remote = useContentLinks(linkId || null);
  const [pending, setPending] = useState<Linkable[]>([]);

  const linked = linkId ? remote.linked : pending;
  const link = (item: Linkable) =>
    linkId ? remote.link(item) : setPending((items) => [...items, item]);
  const unlink = (itemId: string) =>
    linkId ? remote.unlink(itemId) : setPending((items) => items.filter((i) => i.id !== itemId));

  /** 新建的那筆拿到編號了，把選好的關聯補上去 */
  async function flushPending(id: string) {
    if (pending.length === 0) return;
    await fetch(`/api/links/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otherIds: pending.map((item) => item.id) }),
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="flex max-w-2xl flex-col gap-4"
    >
      {modules.map((module) => (
        <ModuleFields
          key={module.key}
          module={module}
          values={values}
          onChange={set}
          onUrlPaste={canScrape ? handleUrlPaste : undefined}
        />
      ))}
      {fetching && <p className="text-xs text-gray-500">抓取中…</p>}
      {!fetching && fetchNote && <p className="text-xs text-gray-500">{fetchNote}</p>}

      {/* 出處與關鍵字都是站內關聯，共用這一格——連到書還是連到關鍵字，chip 上標種類就分得出來。
          沒勾任何關聯模組的類型不畫這一格。新增時還沒有編號，選的先收在 pending，存檔後補上 */}
      {linkLabel && (
        <ContentLinkInput
          label={linkLabel}
          excludeId={linkId || undefined}
          linked={linked}
          onLink={link}
          onUnlink={unlink}
        />
      )}

      <FormActions
        saving={saving}
        onCancel={() => router.back()}
        onDelete={recordId ? remove : undefined}
        error={error}
      />
    </form>
  );
}
