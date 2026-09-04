"use client";

import { useEffect, useRef, useState } from "react";
import { scrapeBook, searchBookByTitle } from "@/features/books/api/lookup-book";
import { useBookRefetchStore } from "@/features/books/stores/use-book-refetch-store";
import { fullerTitle } from "@/lib/metadata";

/** 表單的欄位都是字串，這支只認得「有沒有值」，不需要知道有哪些欄位 */
type Fields = Record<string, unknown>;

/**
 * 用現在表單裡的書名／網址重查一次，補上空欄位。
 *
 * 刻意只補空的：使用者手動改過的內容比外部來源可信，不能被一鍵蓋掉。
 * 書名是唯一的例外——抓到更完整的版本（多半是補上副標題）就換掉。
 *
 * 按鈕在頁首、狀態在表單，兩邊是兄弟，靠 store 接起來：掛載時登記動作、
 * 離開時清掉。登記的是 ref 不是函式本身，所以只登記一次，不用每次 render 重登。
 */
export function useBookRefetch<T extends Fields>(
  form: T,
  setForm: (update: (previous: T) => T) => void,
) {
  const [running, setRunning] = useState(false);
  const [note, setNote] = useState("");

  const latest = useRef(() => {});
  const { register, setProgress, reset } = useBookRefetchStore();

  useEffect(() => {
    register(() => latest.current());
    return reset;
  }, [register, reset]);

  useEffect(() => {
    setProgress({ running, note });
  }, [running, note, setProgress]);

  async function refetch() {
    const url = String(form.sourceUrl ?? "").trim();
    const title = String(form.title ?? "").trim();
    if (!url && !title) {
      setNote("請先填書名或來源網址");
      return;
    }

    setRunning(true);
    setNote("");
    try {
      const found = url ? await scrapeBook(url) : await searchBookByTitle(title);
      if (!found) {
        setNote("查不到這本書的資料");
        return;
      }

      const filled: string[] = [];
      setForm((previous) => {
        const next = { ...previous };
        for (const [key, value] of Object.entries(found)) {
          if (!(key in next) || typeof value !== "string" || !value.trim()) continue;
          if (String(next[key as keyof T] ?? "").trim()) continue;
          (next as Fields)[key] = value;
          filled.push(key);
        }
        const fuller = fullerTitle(String(previous.title ?? ""), found.title);
        if (fuller) {
          (next as Fields).title = fuller;
          filled.push("title");
        }
        return next;
      });
      setNote(filled.length ? `補上 ${filled.length} 個欄位` : "沒有可補的欄位");
    } catch (err) {
      setNote(err instanceof Error ? err.message : "抓取失敗");
    } finally {
      setRunning(false);
    }
  }

  // render 當中不能碰 ref：換成 effect，每次 render 之後才更新成最新的那支。
  // 登記進 store 的那層包著 ref，所以只登記一次
  useEffect(() => {
    latest.current = refetch;
  });
}
