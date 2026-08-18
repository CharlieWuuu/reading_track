"use client";

import { useState } from "react";
import { KeywordPopup } from "@/components/keywords/KeywordPopup";

/**
 * 畫面上每一個關鍵字標籤。
 *
 * 全站只有這一個：書寫的時間軸、書籍與文章的詳細頁、卡片牆點到的字，
 * 點下去都是同一件事——先看它是什麼，要改再從視窗裡按編輯。
 */
export function KeywordTag({ name, className }: { name: string; className?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {name}
      </button>
      {open && <KeywordPopup name={name} onClose={() => setOpen(false)} />}
    </>
  );
}
