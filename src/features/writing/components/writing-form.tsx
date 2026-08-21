"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarCheck, Link as LinkIcon, NotebookPen, Shapes, Tag } from "lucide-react";
import { CategorySelect } from "@/components/ui/category-select";
import { Field } from "@/components/ui/field";
import { FormActions } from "@/components/ui/form-actions";
import { compactLines } from "@/components/ui/line-list-input";
import { OptionSelect } from "@/components/ui/option-select";
import { PrivateToggle } from "@/components/ui/private-toggle";
import { writingEditHref } from "@/config/routes";
import { SourcePicker } from "@/features/writing/components/source-picker";
import { useWritingsFormTab } from "@/features/writing/components/writing-form-tabs";
import { useMetrics } from "@/hooks/use-metrics";
import { useRecordForm } from "@/hooks/use-record-form";
import { useUrlParams } from "@/hooks/use-url-param";
import { useWritings } from "@/hooks/use-writings";
import { keywordEditHref, useCurrentHref } from "@/lib/keywords/href";
import { useSheetStore } from "@/stores/use-sheet-store";
import { splitLines } from "@/types/book";
import { Writing } from "@/types/writing";
import { fromDateTimeInput, now, toDateTimeInput } from "@/utils/date";

// 內文吃掉整個表單剩下的高度：這一欄是主體，寫長了不該只給它一個小框
const TEXTAREA_CLASS =
  "min-h-32 w-full min-w-0 flex-1 resize-none rounded border px-3 py-2 text-sm";

/** 沒選到的分頁留在畫面上但藏起來，切回來時打到一半的內容還在 */
function TabPanel({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div className={`min-h-0 flex-1 flex-col gap-3 ${active ? "flex" : "hidden"}`}>{children}</div>
  );
}

const emptyForm = {
  date: "",
  title: "",
  kind: "",
  keywords: "",
  note: "",
  link: "",
  sourceTitle: "",
  sourceId: "",
  private: "",
};

type FormState = typeof emptyForm;

/** 送出去的那一份：空日期是 null，關鍵字去掉空行 */
function toPayload(form: FormState) {
  return { ...form, date: form.date || null, keywords: compactLines(form.keywords) };
}

/** 從書籍頁按「寫一則心得」進來時，延伸自與類型已經知道了，不用再選一次 */
function toForm(entry: Writing | undefined, prefill: Partial<FormState>): FormState {
  if (!entry) return { ...emptyForm, date: now(), ...prefill };
  return {
    ...emptyForm,
    ...Object.fromEntries(Object.entries(entry).filter(([, v]) => v !== undefined && v !== null)),
    date: entry.date ?? "",
  } as FormState;
}

/**
 * 一件事 + 我怎麼想。心得欄是主體，其他欄位都是為了讓它之後找得到。
 */
export function WritingForm({ entry }: { entry?: Writing }) {
  const router = useRouter();
  const from = useCurrentHref();
  const { sheetId } = useSheetStore();
  const { writings, mutate } = useWritings();
  const { tab, setTab } = useWritingsFormTab();
  const isEdit = Boolean(entry);

  // 建議只收紀事自己用過的：書、文章、紀事各記各的，混在一起選單會很吵
  const keywordSuggestions = [...new Set(writings.flatMap((e) => splitLines(e.keywords)))].sort(
    (a, b) => a.localeCompare(b, "zh-Hant"),
  );

  const { searchParams } = useUrlParams();
  const [form, setForm] = useState<FormState>(() =>
    toForm(entry, {
      sourceId: searchParams.get("sourceId") ?? "",
      sourceTitle: searchParams.get("sourceTitle") ?? "",
      kind: searchParams.get("kind") ?? "",
      // 從書籍／文章那個框帶過來的草稿，不用再打一次
      note: searchParams.get("note") ?? "",
    }),
  );
  const [fetchingStats, setFetchingStats] = useState(false);
  const [statsNote, setStatsNote] = useState("");
  const { latestByWriting, mutate: mutateMetrics } = useMetrics();
  const latest = entry ? latestByWriting.get(entry.id) : undefined;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const {
    submitting,
    error: submitError,
    setError: setSubmitError,
    handleSubmit,
    handleDelete,
    openRecordThen,
  } = useRecordForm({
    resource: "writings",
    editHref: writingEditHref,
    bodyKey: "writing",
    existingId: entry?.id ?? "",
    payload: toPayload(form),
    redirectTo: "/writing",
    mutate,
    validate: () => (form.title.trim() ? undefined : "請填標題"),
  });

  /** 點關鍵字跳到那個字的編輯頁；沒填標題就先擋下來，不然新增頁沒東西可落地 */
  function openKeyword(name: string) {
    if (!form.title.trim()) {
      setTab("text");
      setSubmitError("請先填標題");
      return;
    }
    openRecordThen((back) => router.push(keywordEditHref(name, back)), from);
  }

  /**
   * 量一次現在有多少人看，append 成新的一列——不覆蓋舊的，累積起來就是成長曲線。
   * 要有紀事編號才掛得上去，所以只有存過的那則才抓得動。
   */
  async function handleFetchStats() {
    if (!entry || !sheetId) return;
    const url = form.link.trim();
    if (!url) {
      setStatsNote("請先填來源網址");
      return;
    }

    setFetchingStats(true);
    setStatsNote("");
    try {
      const res = await fetch("/api/scrape-stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const stats = await res.json();
      if (!res.ok) throw new Error(stats.error ?? "抓取失敗");

      const metric = {
        id: crypto.randomUUID(),
        date: now(),
        writingId: entry.id,
        title: form.title || stats.title || "",
        platform: stats.platform,
        views: stats.views,
        reads: stats.reads,
      };
      const saved = await fetch("/api/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetId, metric }),
      });
      if (!saved.ok) throw new Error("寫入失敗");

      await mutateMetrics();
      setStatsNote(
        `${stats.platform}：${stats.views} 次瀏覽${stats.reads ? `、${stats.reads} 次閱讀` : ""}`,
      );
    } catch (err) {
      setStatsNote(err instanceof Error ? err.message : "抓取失敗");
    } finally {
      setFetchingStats(false);
    }
  }

  return (
    // 標題在「文字」那一頁，沒填時要先切過去，不然錯誤訊息旁邊是空的
    <form
      onSubmit={(e) => {
        if (!form.title.trim()) setTab("text");
        handleSubmit(e);
      }}
      className="flex min-h-0 flex-1 flex-col gap-3"
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
        <TabPanel active={tab === "text"}>
          <div className="shrink-0">
            <Field label="標題" value={form.title} onChange={(v) => set("title", v)} />
          </div>

          {/* 內文放最大：它是這張表唯一的主體，其他欄位都是為了讓它找得到 */}
          <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-1">
            <label className="flex shrink-0 items-center gap-1.5 text-sm font-medium">
              <NotebookPen size={14} strokeWidth={1.5} className="shrink-0 text-gray-400" />
              內文
            </label>
            <textarea
              value={form.note}
              onChange={(e) => set("note", e.target.value)}
              className={TEXTAREA_CLASS}
            />
          </div>
        </TabPanel>

        <TabPanel active={tab === "tags"}>
          <div className="grid min-h-0 shrink-0 grid-cols-2 content-start gap-3 sm:grid-cols-3">
            {/* 日期、類型、關鍵字同一列；手機排不成三欄，關鍵字自己換到下一行 */}
            <Field
              label="日期"
              Icon={CalendarCheck}
              type="datetime-local"
              value={toDateTimeInput(form.date)}
              onChange={(v) => set("date", fromDateTimeInput(v))}
            />
            <CategorySelect
              label="類型"
              Icon={Shapes}
              categoryKey="kind"
              value={form.kind}
              onChange={(v) => set("kind", v)}
            />
            <div className="col-span-2 min-w-0 sm:col-span-1">
              {/* 關鍵字跟類型同一顆選單，只是它一行一筆存回 Sheet */}
              <OptionSelect
                label="關鍵字"
                Icon={Tag}
                options={keywordSuggestions}
                value={form.keywords}
                onChange={(v) => set("keywords", v)}
                onEditOption={openKeyword}
                separator={"\n"}
                multiple
              />
            </div>

            {/* 私人也是一種標記，跟類型、關鍵字放同一頁 */}
            <div className="col-span-2 sm:col-span-3">
              <PrivateToggle value={form.private} onChange={(v) => set("private", v)} />
            </div>

            {/* 讀了什麼之後寫的。心得就是靠這一欄指回那本書 */}
            <div className="col-span-2 sm:col-span-3">
              <SourcePicker
                title={form.sourceTitle}
                onChange={(title, id) =>
                  setForm((f) => ({ ...f, sourceTitle: title, sourceId: id }))
                }
              />
            </div>

            {/* 這則放在哪裡：發表的網址，或「紙本日記 8/17」這種純文字 */}
            <div className="col-span-2 flex items-end gap-2 sm:col-span-3">
              <div className="min-w-0 flex-1">
                <Field
                  label="來源"
                  Icon={LinkIcon}
                  hint="網址或純文字都可以，例如「紙本日記 8/17」"
                  value={form.link}
                  onChange={(v) => set("link", v)}
                />
              </div>
              {/* 量測要掛在編號上，所以存過的那則才抓得動 */}
              {isEdit && (
                <button
                  type="button"
                  onClick={handleFetchStats}
                  disabled={fetchingStats}
                  className="shrink-0 rounded border px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                >
                  {fetchingStats ? "抓取中…" : "抓取數據"}
                </button>
              )}
            </div>
            {(statsNote || latest) && (
              <p className="col-span-2 -mt-1 text-xs text-gray-500 sm:col-span-3">
                {statsNote ||
                  (latest &&
                    `${latest.platform}：${latest.views} 次瀏覽${
                      latest.reads ? `、${latest.reads} 次閱讀` : ""
                    }（${latest.date}）`)}
              </p>
            )}
          </div>
        </TabPanel>
      </div>

      <FormActions
        saving={submitting}
        saveLabel={isEdit ? "儲存變更" : "新增書寫"}
        onDelete={isEdit ? handleDelete : undefined}
        deleteLabel="刪除這一筆"
        confirmLabel="確定刪除這一筆？"
        error={submitError}
      />
    </form>
  );
}
