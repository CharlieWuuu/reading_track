"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CalendarCheck, Link as LinkIcon, NotebookPen, Shapes, Tag } from "lucide-react";
import { CategorySelect } from "@/components/books/CategorySelect";
import { compactLines, LineListInput } from "@/components/books/LineListInput";
import { Field } from "@/components/ui/Field";
import { PrivateToggle } from "@/components/ui/PrivateToggle";
import { keywordEditHref } from "@/lib/keywords/href";
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
  // 自動存檔用：存過什麼、存成哪一筆、以及這一筆是不是已經被刪了
  const [initialSnapshot] = useState(() => JSON.stringify(toPayload(form)));
  const savedRef = useRef(initialSnapshot);
  const savedIdRef = useRef(entry?.id ?? "");
  const deletedRef = useRef(false);
  const [newId] = useState(() => crypto.randomUUID());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [fetchingStats, setFetchingStats] = useState(false);
  const [statsNote, setStatsNote] = useState("");
  const { latestByEntry, mutate: mutateMetrics } = useMetrics();
  const latest = entry ? latestByEntry.get(entry.id) : undefined;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  /**
   * 離開頁面時自動存檔。
   *
   * 寫字的時候按不按儲存不該是使用者要記得的事——想到一半切去別頁、關掉分頁，
   * 回來東西還在才是對的。這裡只在「真的改過」而且有標題時才送，
   * 沒動過的頁面不會多寫一次，空白的新增頁也不會憑空生出一筆。
   *
   * keepalive 讓請求在頁面關掉之後仍然送得出去；也因為這樣，它不等回應、
   * 不改畫面上的任何狀態——那時候已經沒有畫面了。
   */
  function quietSave(): Promise<unknown> | undefined {
    if (deletedRef.current || !sheetId || !form.title.trim()) return;
    const payload = toPayload(form);
    const snapshot = JSON.stringify(payload);
    if (snapshot === savedRef.current) return;
    savedRef.current = snapshot;

    // 已經存過就是改同一筆：自動存了兩次不該變成兩則
    const id = savedIdRef.current;
    const request = id
      ? fetch(`/api/entries/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sheetId, patch: payload }),
          keepalive: true,
        })
      : fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sheetId, entry: { id: newId, ...payload } }),
          keepalive: true,
        });
    savedIdRef.current = id || newId;
    return request.then(() => mutate()).catch(() => {});
  }

  /**
   * 點關鍵字跳到那個字的編輯頁。
   *
   * 從「新增書寫」跳走時先讓這一則落地成一筆，並把網址換成它的編輯頁——
   * 不然按上一頁會回到空的新增頁，再存一次就變成兩則。
   */
  async function openKeyword(name: string) {
    const isNew = !entry && !savedIdRef.current;
    await quietSave();
    if (isNew && savedIdRef.current) router.replace(`/entries/${savedIdRef.current}/edit`);
    router.push(keywordEditHref(name));
  }

  // 每次重畫都把最新的那一份放進 ref：卸載時跑的是當下的內容，不是掛載那一刻的
  const quietSaveRef = useRef(quietSave);
  useEffect(() => {
    quietSaveRef.current = quietSave;
  });

  useEffect(() => {
    // 手機切到別的 app、關掉分頁都只會發 visibilitychange，不會走 unmount
    const onHide = () => document.visibilityState === "hidden" && quietSaveRef.current();
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      quietSaveRef.current();
    };
  }, []);

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

    const payload = toPayload(form);

    setSubmitting(true);
    setSubmitError("");
    try {
      // 自動存檔可能已經先建好這一筆了，那按下儲存就是改它，不是再開一筆
      const existingId = entry?.id || savedIdRef.current;
      if (existingId) {
        const res = await fetch(`/api/entries/${existingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sheetId, patch: payload }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "更新失敗");
      } else {
        const newEntry: Entry = { id: newId, ...payload };
        const res = await fetch("/api/entries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sheetId, entry: newEntry }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "新增失敗");
      }

      savedRef.current = JSON.stringify(payload);
      savedIdRef.current = savedIdRef.current || newId;
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
    // 刪完會離開這一頁，卸載時的自動存檔不能把它救回來
    deletedRef.current = true;

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
      setConfirmDelete(false);
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
            <div className="col-span-2 flex min-w-0 flex-col gap-1 sm:col-span-1">
              <label className="flex shrink-0 items-center gap-1.5 text-sm font-medium">
                <Tag size={14} strokeWidth={1.5} className="shrink-0 text-gray-400" />
                關鍵字
              </label>
              <LineListInput
                value={form.keywords}
                onChange={(v) => set("keywords", v)}
                placeholder="注意力"
                suggestions={keywordSuggestions}
                onEditRow={openKeyword}
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

      {submitError && <p className="shrink-0 text-xs text-red-600">{submitError}</p>}

      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50"
        >
          {submitting ? "儲存中…" : isEdit ? "儲存變更" : "新增書寫"}
        </button>

        {/* 刪除只出現在編輯頁，按一次先要求確認，避免誤刪 */}
        {isEdit &&
          (confirmDelete ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-gray-500">確定刪除這一筆？</span>
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
              刪除這一筆
            </button>
          ))}
      </div>
    </form>
  );
}
