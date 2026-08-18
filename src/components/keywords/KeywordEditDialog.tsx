"use client";

import { KeywordForm } from "@/components/keywords/KeywordForm";
import { Dialog } from "@/components/ui/Dialog";
import { KeywordInfo } from "@/types/keyword";

/**
 * 表單裡順手改關鍵字用的對話框。
 *
 * 瀏覽的時候（卡片牆、圖表）點關鍵字是跳到它自己的編輯頁；但在書籍、文章、
 * 書寫的表單裡不能跳走——那會丟掉還沒存的內容，所以那三個地方留著對話框。
 */
export function KeywordEditDialog({
  info,
  onSave,
  onDelete,
  onClose,
}: {
  info: KeywordInfo;
  onSave: (info: KeywordInfo, previousName: string) => Promise<void>;
  onDelete?: (name: string) => Promise<unknown>;
  onClose: () => void;
}) {
  return (
    <Dialog title={info.name} onClose={onClose}>
      <KeywordForm info={info} onSave={onSave} onDelete={onDelete} onDone={onClose} />
    </Dialog>
  );
}
