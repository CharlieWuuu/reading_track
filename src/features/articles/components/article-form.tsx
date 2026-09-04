"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CategorySelect } from "@/components/ui/category-select";
import { Field } from "@/components/ui/field";
import { FormActions } from "@/components/ui/form-actions";
import { compactLines } from "@/components/ui/line-list-input";
import { OptionSelect } from "@/components/ui/option-select";
import { PrivateToggle } from "@/components/ui/private-toggle";
import { articleEditHref, keywordEditHref, writingNewHref } from "@/config/routes";
import { scrapeArticle } from "@/features/articles/api/scrape-article";
import { useArticleFormTab } from "@/features/articles/components/article-form-tabs";
import { RelatedWriting } from "@/features/writing/components/related-writings";
import { useArticles } from "@/hooks/use-articles";
import { useRecordForm } from "@/hooks/use-record-form";
import { useCurrentHref } from "@/lib/keywords/href";
import { Article } from "@/types/article";
import { splitLines } from "@/types/book";
import { today } from "@/utils/date";

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
  const { articles, mutate } = useArticles();
  const isEdit = Boolean(article);

  // 建議只收文章自己用過的：書、文章、紀事各記各的，混在一起選單會很吵
  const keywordSuggestions = [...new Set(articles.flatMap((a) => splitLines(a.keywords)))].sort(
    (a, b) => a.localeCompare(b, "zh-Hant"),
  );

  const { tab } = useArticleFormTab();
  const [form, setForm] = useState<FormState>(toForm(article ?? {}, isEdit));
  const [fetching, setFetching] = useState(false);
  const [fetchNote, setFetchNote] = useState("");

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
      const found = await scrapeArticle(url);

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

  const {
    submitting,
    error: submitError,
    setError: setSubmitError,
    handleSubmit,
    handleDelete,
    openRecordThen,
  } = useRecordForm({
    resource: "articles",
    editHref: articleEditHref,
    existingId: article?.id ?? "",
    payload: toPayload(form, article),
    redirectTo: "/reading/articles",
    mutate,
    validate: () => (form.title.trim() ? undefined : "請填標題"),
  });

  /** 點關鍵字跳到那個字的編輯頁；沒填標題就先擋下來，不然新增頁沒東西可落地 */
  function openKeyword(name: string) {
    if (!form.title.trim()) {
      setSubmitError("請先填標題");
      return;
    }
    openRecordThen((back) => router.push(keywordEditHref(name, back)), from);
  }

  /** 心得寫成一則書寫；先把這篇文章存完再跳，不讓兩邊的寫入同時打 Sheet */
  function openWriting(id: string) {
    openRecordThen(
      () => router.push(writingNewHref({ sourceId: id, sourceTitle: form.title, kind: "文章" })),
      from,
    );
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
                className="rounded-control shrink-0 border px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                {fetching ? "抓取中…" : "抓取資料"}
              </button>
            </div>
            {fetchNote && <p className="col-span-2 -mt-1 text-xs text-gray-500">{fetchNote}</p>}

            {/* 平台是站台名（報導者），期刊論文就填期刊名；作者常常抓不到，允許空白 */}
            <CategorySelect
              label="平台"
              categoryKey="platform"
              value={form.platform}
              onChange={(v) => set("platform", v)}
            />
            <Field label="作者" value={form.author} onChange={(v) => set("author", v)} />

            {/* 文章多半一次讀完，只記「哪天讀的」，沒有開始日期 */}
            <Field
              label="閱讀日期"
              type="date"
              value={form.endDate}
              onChange={(v) => set("endDate", v)}
            />
            <CategorySelect
              label="語言"
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
              categoryKey="domain"
              value={form.domain}
              onChange={(v) => set("domain", v)}
            />
            <CategorySelect
              label="次領域"
              categoryKey="subDomain"
              value={form.subDomain}
              onChange={(v) => set("subDomain", v)}
              parentValue={form.domain}
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
              options={keywordSuggestions}
              value={form.keywords}
              onChange={(v) => set("keywords", v)}
              onEditOption={openKeyword}
              placeholder="一個一組：地名、人名、事件、專有名詞"
              separator={"\n"}
              multiple
            />
          </div>
        </TabPanel>

        {/* 心得寫成書寫，跟書籍同一套：一篇文章可以有很多則，所以自己一頁 */}
        <TabPanel active={tab === "notes"}>
          {isEdit && article ? (
            <RelatedWriting sourceIds={[article.id]} onWrite={() => openWriting(article.id)} />
          ) : (
            <p className="rounded-control border border-dashed px-3 py-2 text-xs text-gray-400">
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
