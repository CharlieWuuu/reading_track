"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CalendarCheck, Languages, Link as LinkIcon, Store, Tag } from "lucide-react";
import { useArticleFormTab } from "@/components/articles/ArticleFormTabs";
import { CategorySelect } from "@/components/books/CategorySelect";
import { compactLines } from "@/components/books/LineListInput";
import { RelatedEntries } from "@/components/entries/RelatedEntries";
import { Field } from "@/components/ui/Field";
import { FormActions } from "@/components/ui/FormActions";
import { OptionSelect } from "@/components/ui/OptionSelect";
import { PrivateToggle } from "@/components/ui/PrivateToggle";
import { keywordEditHref, useCurrentHref } from "@/lib/keywords/href";
import { useArticles } from "@/lib/useArticles";
import { useSheetStore } from "@/store/useSheetStore";
import { Article } from "@/types/article";
import { splitLines } from "@/types/book";

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
/** 送出去的那一份：心得不在這張表單裡，原樣帶回去才不會被清掉 */
function toPayload(form: FormState, article?: Article) {
  return {
    ...form,
    note: article?.note ?? "",
    endDate: form.endDate || null,
    keywords: compactLines(form.keywords),
  };
}

export function ArticleForm({ article }: { article?: Article }) {
  const router = useRouter();
  const from = useCurrentHref();
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
  const [fetching, setFetching] = useState(false);
  const [fetchNote, setFetchNote] = useState("");
  // 自動存檔用：存過什麼、存成哪一筆、以及這一筆是不是已經被刪了
  const [initialSnapshot] = useState(() => JSON.stringify(toPayload(form, article)));
  const savedRef = useRef(initialSnapshot);
  const savedIdRef = useRef(article?.id ?? "");
  const deletedRef = useRef(false);
  const [newId] = useState(() => crypto.randomUUID());

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

  /**
   * 離開頁面時自動存檔，做法與書寫的表單相同。
   *
   * 這裡特別要緊：點關鍵字會跳到那個字的編輯頁，沒有這一段的話，
   * 剛打到一半的內容就留在被卸載的表單裡了。
   */
  function quietSave(): Promise<unknown> | undefined {
    if (deletedRef.current || !sheetId || !form.title.trim()) return;
    const payload = toPayload(form, article);
    const snapshot = JSON.stringify(payload);
    if (snapshot === savedRef.current) return;
    savedRef.current = snapshot;

    const id = savedIdRef.current;
    const request = id
      ? fetch(`/api/articles/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sheetId, patch: payload }),
          keepalive: true,
        })
      : fetch("/api/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sheetId, article: { id: newId, ...payload } }),
          keepalive: true,
        });
    savedIdRef.current = id || newId;
    return request.then(() => mutate()).catch(() => {});
  }

  /**
   * 點關鍵字跳到那個字的編輯頁。
   *
   * 從「新增文章」跳走時先讓這一篇落地成一筆，並把網址換成它的編輯頁——
   * 不然按上一頁會回到空的新增頁，再存一次就變成兩篇。
   */
  async function openKeyword(name: string) {
    const isNew = !article && !savedIdRef.current;
    await quietSave();
    if (isNew && savedIdRef.current) router.replace(`/articles/${savedIdRef.current}/edit`);
    // 新增頁剛剛才落地成一筆，回來要回到那一筆的編輯頁而不是空的新增頁
    const back = isNew && savedIdRef.current ? `/articles/${savedIdRef.current}/edit` : from;
    router.push(keywordEditHref(name, back));
  }

  // 每次重畫都把最新的那一份放進 ref：卸載時跑的是當下的內容
  const quietSaveRef = useRef(quietSave);
  useEffect(() => {
    quietSaveRef.current = quietSave;
  });

  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && quietSaveRef.current();
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      quietSaveRef.current();
    };
  }, []);

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

    const payload = toPayload(form, article);

    setSubmitting(true);
    setSubmitError("");
    try {
      // 自動存檔可能已經先建好這一筆了，那按下儲存就是改它，不是再開一篇
      const existingId = article?.id || savedIdRef.current;
      if (existingId) {
        const res = await fetch(`/api/articles/${existingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sheetId, patch: payload }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "更新失敗");
      } else {
        const newArticle: Article = { id: newId, ...payload };
        const res = await fetch("/api/articles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sheetId, article: newArticle }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "新增失敗");
      }

      savedRef.current = JSON.stringify(payload);
      savedIdRef.current = savedIdRef.current || newId;
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
    // 刪完會離開這一頁，卸載時的自動存檔不能把它救回來
    deletedRef.current = true;

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
          <div className="min-w-0">
            <OptionSelect
              label="關鍵字"
              Icon={Tag}
              options={keywordSuggestions}
              value={form.keywords}
              onChange={(v) => set("keywords", v)}
              onEditOption={openKeyword}
              placeholder="一個一組：地名、人名、事件、專有名詞"
              separator="\n"
              multiple
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

      <FormActions
        saving={submitting}
        saveLabel={isEdit ? "儲存變更" : "新增文章"}
        onDelete={isEdit ? handleDelete : undefined}
        deleteLabel="刪除這篇文章"
        confirmLabel="確定刪除這篇文章？"
        error={submitError}
      />
    </form>
  );
}
