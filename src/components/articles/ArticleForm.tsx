"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarCheck, Languages, Link as LinkIcon, Store, Tag } from "lucide-react";
import { useArticleFormTab } from "@/components/articles/ArticleFormTabs";
import { CategorySelect } from "@/components/books/CategorySelect";
import { compactLines, LineListInput } from "@/components/books/LineListInput";
import { RelatedEntries } from "@/components/entries/RelatedEntries";
import { Field } from "@/components/ui/Field";
import { PrivateToggle } from "@/components/ui/PrivateToggle";
import { useArticles } from "@/lib/useArticles";
import { useKeywordInfos } from "@/lib/useKeywordInfos";
import { useSheetStore } from "@/store/useSheetStore";
import { Article } from "@/types/article";
import { splitLines } from "@/types/book";
import { EMPTY_KEYWORD_INFO } from "@/types/keyword";
import { KeywordEditDialog } from "../keywords/KeywordEditDialog";

/** 沒選到的分頁留在畫面上但藏起來，切回來時打到一半的內容還在 */
function TabPanel({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div className={`flex-col gap-3 md:min-h-0 md:flex-1 ${active ? "flex" : "hidden"}`}>
      {children}
    </div>
  );
}

const emptyForm = {
  title: "",
  author: "",
  platform: "",
  sourceUrl: "",
  endDate: "",
  domain: "",
  subDomain: "",
  type: "",
  language: "",
  private: "",
  note: "",
  keywords: "",
};

type FormState = typeof emptyForm;

/** 本地時區的今天；用 toISOString 會在台灣的早上八點前拿到昨天 */
function today() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

function toForm(article: Partial<Article>, isEdit: boolean): FormState {
  return {
    ...emptyForm,
    // 新增時預設今天：文章多半是剛讀完才記下來的
    endDate: isEdit ? "" : today(),
    ...Object.fromEntries(Object.entries(article).filter(([, v]) => v !== undefined && v !== null)),
    ...(article.endDate ? { endDate: article.endDate } : {}),
  } as FormState;
}

/**
 * 跟書籍一樣分「文章」與「標記」兩頁：欄位性質不同，混在一頁要一直上下找。
 * 佳句與單字目前只掛在書上，等文章真的記到需要它們再說。
 */
export function ArticleForm({ article }: { article?: Article }) {
  const router = useRouter();
  const { sheetId } = useSheetStore();
  const { articles, mutate } = useArticles();
  const isEdit = Boolean(article);

  // 建議只收文章自己用過的：書、文章、紀事各記各的，混在一起選單會很吵
  const keywordSuggestions = [...new Set(articles.flatMap((a) => splitLines(a.keywords)))].sort(
    (a, b) => a.localeCompare(b, "zh-Hant"),
  );

  const { tab } = useArticleFormTab();
  const [form, setForm] = useState<FormState>(toForm(article ?? {}, isEdit));
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingKeyword, setEditingKeyword] = useState<string | null>(null);
  const [fetching, setFetching] = useState(false);
  const [fetchNote, setFetchNote] = useState("");
  const { byName: keywordInfos, save: saveKeyword } = useKeywordInfos();

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  /**
   * 用網址抓標題、站台、作者。刻意只補空欄位——
   * 手動改過的內容比抓回來的可信，不能被一鍵蓋掉（理由同書籍的「重新抓取」）。
   *
   * 貼上網址會直接觸發，所以要收 override：onPaste 比 state 更新早一步發生，
   * 這時候讀 form.sourceUrl 拿到的還是上一個值。
   */
  async function handleFetch(override?: string) {
    const url = (override ?? form.sourceUrl).trim();
    if (!url) {
      setFetchNote("請先填來源網址");
      return;
    }

    setFetching(true);
    setFetchNote("");
    try {
      const res = await fetch("/api/scrape-article", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const found = await res.json();
      if (!res.ok) throw new Error(found.error ?? "抓取失敗");

      const filled: string[] = [];
      setForm((f) => {
        const next = { ...f };
        for (const [key, value] of Object.entries(found)) {
          const k = key as keyof FormState;
          if (!(k in next) || typeof value !== "string" || !value.trim()) continue;
          if (next[k].trim()) continue;
          next[k] = value;
          filled.push(k);
        }
        return next;
      });
      setFetchNote(filled.length ? `補上 ${filled.length} 個欄位` : "沒有可補的欄位");
    } catch (err) {
      setFetchNote(err instanceof Error ? err.message : "抓取失敗");
    } finally {
      setFetching(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setSubmitError("請填標題");
      return;
    }
    if (!sheetId) {
      setSubmitError("請先到「設定」頁面連接 Google Sheet");
      return;
    }

    const payload = {
      ...form,
      note: article?.note ?? "",
      endDate: form.endDate || null,
      keywords: compactLines(form.keywords),
    };

    setSubmitting(true);
    setSubmitError("");
    try {
      if (isEdit && article) {
        const res = await fetch(`/api/articles/${article.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sheetId, patch: payload }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "更新失敗");
      } else {
        const newArticle: Article = { id: crypto.randomUUID(), ...payload };
        const res = await fetch("/api/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sheetId, article: newArticle }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "新增失敗");
      }

      await mutate();
      router.push("/books?type=article");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!article || !sheetId) return;

    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(
        `/api/articles/${article.id}?sheetId=${encodeURIComponent(sheetId)}`,
        { method: "DELETE" },
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "刪除失敗");
      }
      await mutate(
        (current) => ({ articles: (current?.articles ?? []).filter((a) => a.id !== article.id) }),
        { revalidate: false },
      );
      router.push("/books?type=article");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "刪除失敗");
      setSubmitting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:h-full md:min-h-0">
      <div className="flex flex-col gap-3 md:min-h-0 md:flex-1 md:overflow-y-auto">
        <TabPanel active={tab === "article"}>
          <div className="grid min-h-0 shrink-0 grid-cols-2 content-start gap-3">
            <div className="col-span-2">
              <Field label="標題" value={form.title} onChange={(v) => set("title", v)} />
            </div>

            {/* 網址與抓取按鈕同一列：填完網址最順手的下一步就是按它 */}
            <div className="col-span-2 flex items-end gap-2">
              <div className="min-w-0 flex-1">
                <Field
                  label="來源網址"
                  Icon={LinkIcon}
                  value={form.sourceUrl}
                  onChange={(v) => set("sourceUrl", v)}
                  // 貼上就直接抓，不用再按一次按鈕；按鈕留著給手打或想重抓的時候
                  onPaste={(text) => {
                    const url = text.trim();
                    if (!url) return;
                    set("sourceUrl", url);
                    void handleFetch(url);
                  }}
                />
              </div>
              <button
                type="button"
                onClick={() => handleFetch()}
                disabled={fetching}
                className="shrink-0 rounded border px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                {fetching ? "抓取中…" : "抓取資料"}
              </button>
            </div>
            {fetchNote && <p className="col-span-2 -mt-1 text-xs text-gray-500">{fetchNote}</p>}

            {/* 平台是站台名（報導者），期刊論文就填期刊名；作者常常抓不到，允許空白 */}
            <CategorySelect
              label="平台"
              Icon={Store}
              categoryKey="platform"
              value={form.platform}
              onChange={(v) => set("platform", v)}
            />
            <Field label="作者" value={form.author} onChange={(v) => set("author", v)} />

            {/* 文章多半一次讀完，只記「哪天讀的」，沒有開始日期 */}
            <Field
              label="閱讀日期"
              Icon={CalendarCheck}
              type="date"
              value={form.endDate}
              onChange={(v) => set("endDate", v)}
            />
            <CategorySelect
              label="語言"
              Icon={Languages}
              categoryKey="language"
              value={form.language}
              onChange={(v) => set("language", v)}
            />
          </div>
        </TabPanel>

        {/* 標記頁：領域／次領域／屬性跟書共用同一組分類，兩邊才對得起來 */}
        <TabPanel active={tab === "tags"}>
          <div className="grid min-h-0 shrink-0 grid-cols-2 content-start gap-3">
            <CategorySelect
              label="領域"
              categoryKey="articleDomain"
              value={form.domain}
              onChange={(v) => set("domain", v)}
            />
            <CategorySelect
              label="次領域"
              categoryKey="articleSubDomain"
              value={form.subDomain}
              onChange={(v) => set("subDomain", v)}
            />
            <div className="col-span-2">
              <PrivateToggle value={form.private} onChange={(v) => set("private", v)} />
            </div>
            <div className="col-span-2">
              <CategorySelect
                label="屬性"
                categoryKey="type"
                value={form.type}
                onChange={(v) => set("type", v)}
                multiple
              />
            </div>
          </div>

          {/* 關鍵字也是自己貼上去的標籤，跟領域、屬性同一件事，只是值不固定 */}
          <div className="flex min-h-0 w-full min-w-0 flex-col gap-1 md:flex-1">
            <label className="flex shrink-0 items-center gap-1.5 text-sm font-medium">
              <Tag size={14} strokeWidth={1.5} className="shrink-0 text-gray-400" />
              關鍵字
              <span className="text-xs font-normal text-gray-400">
                一個一組：地名、人名、事件、專有名詞
              </span>
            </label>
            <LineListInput
              value={form.keywords}
              onChange={(v) => set("keywords", v)}
              placeholder="京都"
              suggestions={keywordSuggestions}
              onEditRow={setEditingKeyword}
            />
          </div>
        </TabPanel>

        {/* 心得寫成書寫，跟書籍同一套：一篇文章可以有很多則，所以自己一頁 */}
        <TabPanel active={tab === "notes"}>
          {isEdit && article ? (
            <RelatedEntries sourceId={article.id} sourceTitle={form.title} kind="文章心得" />
          ) : (
            <p className="rounded border border-dashed px-3 py-2 text-xs text-gray-400">
              存好這篇文章之後就可以寫心得了
            </p>
          )}
        </TabPanel>
      </div>

      {submitError && <p className="shrink-0 text-xs text-red-600">{submitError}</p>}

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {submitting ? "儲存中…" : isEdit ? "儲存變更" : "新增文章"}
        </button>

        {/* 刪除只出現在編輯頁，按一次先要求確認，避免誤刪 */}
        {isEdit &&
          (confirmDelete ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">確定刪除這篇文章？</span>
              <button
                type="button"
                onClick={handleDelete}
                disabled={submitting}
                className="rounded bg-red-600 px-3 py-1.5 font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                刪除
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="rounded border px-3 py-1.5 text-gray-600 hover:bg-gray-50"
              >
                取消
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              disabled={submitting}
              className="text-xs text-red-600 hover:underline disabled:opacity-50"
            >
              刪除這篇文章
            </button>
          ))}
      </div>

      {editingKeyword && (
        <KeywordEditDialog
          info={keywordInfos.get(editingKeyword) ?? { name: editingKeyword, ...EMPTY_KEYWORD_INFO }}
          onSave={saveKeyword}
          onClose={() => setEditingKeyword(null)}
        />
      )}
    </form>
  );
}
