"use client";

import { useRouter } from "next/navigation";
import { Field } from "@/components/ui/field";
import { FormActions } from "@/components/ui/form-actions";
import { compactLines } from "@/components/ui/line-list-input";
import { OptionSelect } from "@/components/ui/option-select";
import { PrivateToggle } from "@/components/ui/private-toggle";
import { kindHref } from "@/config/kind-routes";
import { keywordEditHref, writingEditHref } from "@/config/routes";
import { SourcePicker } from "@/features/writing/components/source-picker";
import { useWritingsFormTab } from "@/features/writing/components/writing-form-tabs";
import { useEntryForm } from "@/hooks/use-entry-form";
import { useRecordForm } from "@/hooks/use-record-form";
import { useUrlParams } from "@/hooks/use-url-param";
import { useWritings } from "@/hooks/use-writings";
import { useCurrentHref } from "@/lib/keywords/href";
import { splitLines } from "@/types/book";
import { Writing } from "@/types/writing";
import { fromDateTimeInput, now, toDateTimeInput } from "@/utils/date";

// 內文吃掉整個表單剩下的高度：這一欄是主體，寫長了不該只給它一個小框
const TEXTAREA_CLASS = "min-h-32 w-full min-w-0 flex-1 resize-none text-sm outline-none";

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
  topic: "",
  keywords: "",
  note: "",
  link: "",
  sourceTitle: "",
  sourceId: "",
  private: "",
  coverUrl: "",
};

type FormState = typeof emptyForm;

/** 送出去的那一份：新增就用送出的當下當發布時間，關鍵字去掉空行 */
function toPayload(form: FormState, isEdit: boolean) {
  return {
    ...form,
    date: form.date || (isEdit ? null : now()),
    keywords: compactLines(form.keywords),
  };
}

/** 從書籍頁按「寫一則心得」進來時，延伸自與類型已經知道了，不用再選一次 */
function toForm(entry: Writing | undefined, prefill: Partial<FormState>): FormState {
  if (!entry) return { ...emptyForm, ...prefill };
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
  const { writings, mutate } = useWritings();
  const { tab, setTab } = useWritingsFormTab();
  const isEdit = Boolean(entry);

  // 建議只收紀事自己用過的：書、文章、紀事各記各的，混在一起選單會很吵
  const keywordSuggestions = [...new Set(writings.flatMap((e) => splitLines(e.keywords)))].sort(
    (a, b) => a.localeCompare(b, "zh-Hant"),
  );
  const topicSuggestions = [...new Set(writings.map((e) => e.topic).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "zh-Hant"),
  );

  const { searchParams } = useUrlParams();
  const prefill = {
    sourceId: searchParams.get("sourceId") ?? "",
    sourceTitle: searchParams.get("sourceTitle") ?? "",
    kind: searchParams.get("kind") ?? "",
    // 從書籍／文章那個框帶過來的草稿，不用再打一次
    note: searchParams.get("note") ?? "",
  };
  // 背景重抓回來的資料要蓋掉畫面上的舊快取——但只在使用者還沒動過的時候
  const { form, set, update } = useEntryForm(entry, (e) => toForm(e, prefill));

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
    existingId: entry?.id ?? "",
    payload: toPayload(form, isEdit),
    redirectTo: kindHref("writings", "writing"),
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
          {/* 標題與主題同一行：主題是這則的名牌，跟標題一起看才知道自己在寫哪一塊 */}
          <div className="flex shrink-0 items-center gap-2">
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="標題"
              className="min-w-0 flex-1 text-base font-medium outline-none"
            />
            <div className="w-28 shrink-0 md:w-36">
              <OptionSelect
                label="主題"
                options={topicSuggestions}
                value={form.topic}
                onChange={(v) => set("topic", v)}
                placeholder="主題"
                hideLabel
                bare
              />
            </div>
          </div>

          {/* 內文放最大：它是這張表唯一的主體，其他欄位都是為了讓它找得到 */}
          <textarea
            value={form.note}
            onChange={(e) => set("note", e.target.value)}
            placeholder="內文"
            className={TEXTAREA_CLASS}
          />
        </TabPanel>

        <TabPanel active={tab === "tags"}>
          <div className="grid min-h-0 shrink-0 grid-cols-2 content-start gap-3 sm:grid-cols-3">
            {/* 日期只有編輯時才出現：新增那則的時間就是按下新增的當下，沒什麼好選 */}
            {isEdit && (
              <Field
                label="日期"
                type="datetime-local"
                value={toDateTimeInput(form.date)}
                onChange={(v) => set("date", fromDateTimeInput(v))}
              />
            )}
            <div className="col-span-2 min-w-0 sm:col-span-1">
              {/* 關鍵字跟類型同一顆選單，只是它一行一筆存回去 */}
              <OptionSelect
                label="關鍵字"
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
                  update((f) => ({ ...f, sourceTitle: title, sourceId: id }))
                }
              />
            </div>

            {/* 這則放在哪裡：發表的網址，或「紙本日記 8/17」這種純文字 */}
            <div className="col-span-2 sm:col-span-3">
              <Field
                label="來源"
                hint="網址，或「紙本日記 8/17」"
                value={form.link}
                onChange={(v) => set("link", v)}
                hideLabel
              />
            </div>

            {/* 封面圖，選填——像部落格文章那種示意圖，不跟出處的書籍封面連動 */}
            <div className="col-span-2 sm:col-span-3">
              <Field
                label="封面圖網址"
                value={form.coverUrl}
                onChange={(v) => set("coverUrl", v)}
                hideLabel
              />
            </div>
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
