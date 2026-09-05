"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 編輯既有紀錄的表單狀態。
 *
 * 為什麼不是單純的 useState：畫面是先用 localStorage 的舊快取畫出來的
 * （最舊可以到 24 小時前），背景才重抓。表單如果只在掛載那一刻讀一次，
 * 就會一直顯示舊內容——接著使用者一打字，自動存檔把整份舊的送回去，
 * 伺服器上比較新的那一份就被蓋掉了。
 *
 * 所以資料換了要跟著換，但**只在使用者還沒動過這張表單的時候**。
 * 動過就不能碰：那時候畫面上的才是最新的意圖。
 */
export function useEntryForm<E, F>(entry: E | undefined, toForm: (entry: E | undefined) => F) {
  const [form, setForm] = useState<F>(() => toForm(entry));
  const dirty = useRef(false);
  const seen = useRef(entry ? JSON.stringify(entry) : "");

  // toForm 每次 render 都是新的函式，放進 ref 才不會讓 effect 每次都跑。
  // render 當中不能碰 ref，所以更新的動作也放在 effect 裡
  const build = useRef(toForm);
  useEffect(() => {
    build.current = toForm;
  });

  useEffect(() => {
    // entry 不見了不算「資料更新了」：清單暫時抓不到那一筆時把表單清成空白，
    // 使用者會看到自己的內容憑空消失，接著連儲存都過不了驗證
    if (!entry) return;

    const next = JSON.stringify(entry);
    if (next === seen.current) return;
    seen.current = next;
    if (dirty.current) return;
    setForm(build.current(entry));
  }, [entry]);

  /** 使用者改的每一個欄位都走這裡，順便記下「這張表單動過了」 */
  function set<K extends keyof F>(key: K, value: F[K]) {
    dirty.current = true;
    setForm((f) => ({ ...f, [key]: value }));
  }

  /** 少數不是單一欄位的更新（例如一次補進好幾欄） */
  function update(next: (previous: F) => F) {
    dirty.current = true;
    setForm(next);
  }

  return { form, set, update };
}
