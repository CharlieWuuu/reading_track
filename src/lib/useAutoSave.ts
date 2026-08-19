"use client";

import { useEffect, useRef, useState } from "react";

type AutoSaveOptions<P> = {
  /** 還沒填到可以存的程度就先不存（通常是「標題是空的」） */
  ready: boolean;
  /** 編輯既有的那一筆時給編號；新增時是空字串 */
  existingId: string;
  /** 現在這一刻要送出去的內容；跟上次存的一樣就不會再送 */
  payload: P;
  create: (id: string, payload: P) => Promise<unknown>;
  update: (id: string, payload: P) => Promise<unknown>;
};

/**
 * 離開頁面時自動存檔。
 *
 * 寫字的時候按不按儲存不該是使用者要記得的事——想到一半切去別頁、關掉分頁、
 * 或點一個關鍵字跳去看它，回來東西還在才是對的。
 *
 * 只在「真的改過」而且 ready 時才送：沒動過的頁面不會多寫一次，空白的新增頁
 * 也不會憑空生出一筆。送出用 keepalive，請求在頁面關掉之後仍然送得出去；
 * 也因為這樣，它不等回應、不改畫面上的任何狀態——那時候已經沒有畫面了。
 *
 * 新增頁自動存過一次之後就記住編號，之後都是改同一筆，手動按儲存也接得上，
 * 不會變成兩筆。
 */
export function useAutoSave<P>({ ready, existingId, payload, create, update }: AutoSaveOptions<P>) {
  const [newId] = useState(() => crypto.randomUUID());
  const [initialSnapshot] = useState(() => JSON.stringify(payload));
  const savedRef = useRef(initialSnapshot);
  const savedIdRef = useRef(existingId);
  const deletedRef = useRef(false);

  function save(): Promise<unknown> | undefined {
    if (deletedRef.current || !ready) return;
    const snapshot = JSON.stringify(payload);
    if (snapshot === savedRef.current) return;
    savedRef.current = snapshot;

    const id = savedIdRef.current;
    savedIdRef.current = id || newId;
    return (id ? update(id, payload) : create(newId, payload)).catch(() => {});
  }

  // 每次重畫都把最新的那一份放進 ref：卸載時跑的是當下的內容，不是掛載那一刻的
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });

  useEffect(() => {
    // 手機切到別的 app、關掉分頁都只會發 visibilitychange，不會走 unmount
    const onHide = () => document.visibilityState === "hidden" && saveRef.current();
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      saveRef.current();
    };
  }, []);

  return {
    /** 這一筆最後會是哪個編號：已經存過就是那一個，還沒存過就是備好的新編號 */
    newId,
    savedIdRef,
    /** 手動存檔成功後告訴它，卸載時才不會再送一次一模一樣的內容 */
    markSaved(saved: P, id?: string) {
      savedRef.current = JSON.stringify(saved);
      savedIdRef.current = id || savedIdRef.current || newId;
    },
    /** 刪掉之後會離開這一頁，卸載時的自動存檔不能把它救回來 */
    markDeleted() {
      deletedRef.current = true;
    },
    save: () => saveRef.current(),
  };
}
