"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarCheck, Link as LinkIcon, NotebookPen, Shapes, Tag } from "lucide-react";
import { CategorySelect } from "@/components/books/CategorySelect";
import { compactLines } from "@/components/books/LineListInput";
import { Field } from "@/components/ui/Field";
import { FormActions } from "@/components/ui/FormActions";
import { OptionSelect } from "@/components/ui/OptionSelect";
import { PrivateToggle } from "@/components/ui/PrivateToggle";
import { keywordEditHref, useCurrentHref } from "@/lib/keywords/href";
import { useAutoSave } from "@/lib/useAutoSave";
import { useEntries } from "@/lib/useEntries";
import { useMetrics } from "@/lib/useMetrics";
import { useUrlParams } from "@/lib/useUrlParam";
import { useSheetStore } from "@/store/useSheetStore";
import { splitLines } from "@/types/book";
import { Entry } from "@/types/entry";
import { useEntryFormTab } from "./EntryFormTabs";
import { SourcePicker } from "./SourcePicker";

// 內文吃掉整個表單剩下的高度：這一欄是主體，寫長了不該只給它一個小框
const TEXTAREA_CLASS =
  "min-h-32 w-full min-w-0 flex-1 resize-none rounded border px-3 py-2 text-sm";

/** 沒選到的分頁留在畫面上但藏起來，切回來時打到一半的內容還在 */
function TabPanel({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div className={`min-h-0 flex-1 flex-col gap-3 ${active ? "flex" : "hidden"}`}>{children}</div>
  );
}

/** 新增時預設此刻：想記的多半是剛發生的事，每次都要點日曆很煩 */
function today(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return `${day} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/**
 * Sheet 上存「2026-08-18 14:32」，datetime-local 要的是中間一個 T。
 *
 * 存的那一份用空白隔開是因為那一格也是給人讀的，T 只是機器的分隔符號。
 * 舊資料只有日期，補上 00:00 才填得進控制項。
 */
function toInput(value: string): string {
  if (!value.trim()) return "";
  const [day, clock = "00:00"] = value.trim().split(/[ T]/);
  return `${day}T${clock.slice(0, 5)}`;
}

function fromInput(value: string): string {
  return value.replace("T", " ").slice(0, 16);
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
function toForm(entry: Entry | undefined, prefill: Partial<FormState>): FormState {
  if (!entry) return { ...emptyForm, date: today(), ...prefill };
  return {
    ...emptyForm,
    ...Object.fromEntries(Object.entries(entry).filter(([, v]) => v !== undefined && v !== null)),
    date: entry.date ?? "",
  } as FormState;
}

/**
 * 一件事 + 我怎麼想。心得欄是主體，其他欄位都是為了讓它之後找得到。
 */
export function EntryForm({ entry }: { entry?: Entry }) {
  const router = useRouter();
  const from = useCurrentHref();
  const { sheetId } = useSheetStore();
  const { entries, mutate } = useEntries();
  const { tab, setTab } = useEntryFormTab();
  const isEdit = Boolean(entry);

  // 建議只收紀事自己用過的：書、文章、紀事各記各的，混在一起選單會很吵
  const keywordSuggestions = [...new Set(entries.flatMap((e) => splitLines(e.keywords)))].sort(
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
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [fetchingStats, setFetchingStats] = useState(false);
  const [statsNote, setStatsNote] = useState("");
  const { latestByEntry, mutate: mutateMetrics } = useMetrics();
  const latest = entry ? latestByEntry.get(entry.id) : undefined;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const payload = toPayload(form);
  const autoSave = useAutoSave({
    ready: Boolean(sheetId && form.title.trim()),
    existingId: entry?.id ?? "",
    payload,
    create: (id, body) =>
      fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetId, entry: { id, ...body } }),
        keepalive: true,
      }).then(() => mutate()),
    update: (id, body) =>
      fetch(`/api/entries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sheetId, patch: body }),
        keepalive: true,
      }).then(() => mutate()),
  });

  /**
   * 點關鍵字跳到那個字的編輯頁。
   *
   * 從「新增書寫」跳走時先讓這一則落地成一筆，並把網址換成它的編輯頁——
   * 不然按上一頁會回到空的新增頁，再存一次就變成兩則。
   */
  async function openKeyword(name: string) {
    const isNew = !entry && !autoSave.savedIdRef.current;
    await autoSave.save();
    const id = autoSave.savedIdRef.current;
    if (isNew && id) router.replace(`/entries/${id}/edit`);
    router.push(keywordEditHref(name, isNew && id ? `/entries/${id}/edit` : from));
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
        date: today(),
        entryId: entry.id,
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setTab("text");
      setSubmitError("請填標題");
      return;
    }
    if (!sheetId) {
      setSubmitError("請先到「設定」頁面連接 Google Sheet");
      return;
    }

    setSubmitting(true);
    setSubmitError("");
    try {
      // 自動存檔可能已經先建好這一筆了，那按下儲存就是改它，不是再開一筆
      const existingId = entry?.id || autoSave.savedIdRef.current;
      if (existingId) {
        const res = await fetch(`/api/entries/${existingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sheetId, patch: payload }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "更新失敗");
      } else {
        const newEntry: Entry = { id: autoSave.newId, ...payload };
        const res = await fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sheetId, entry: newEntry }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "新增失敗");
      }

      autoSave.markSaved(payload);
      await mutate();
      router.push("/entries");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "儲存失敗");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!entry || !sheetId) return;
    autoSave.markDeleted();

    setSubmitting(true);
    setSubmitError("");
    try {
      const res = await fetch(`/api/entries/${entry.id}?sheetId=${encodeURIComponent(sheetId)}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "刪除失敗");
      }
      await mutate(
        (current) => ({ entries: (current?.entries ?? []).filter((e) => e.id !== entry.id) }),
        { revalidate: false },
      );
      router.push("/entries");
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "刪除失敗");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col gap-3">
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
              value={toInput(form.date)}
              onChange={(v) => set("date", fromInput(v))}
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
                separator="\n"
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
