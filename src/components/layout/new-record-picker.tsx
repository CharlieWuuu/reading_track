"use client";

import Link from "next/link";
import { Dialog } from "@/components/ui/dialog";
import { kindHref } from "@/config/kind-routes";
import { Kind } from "@/lib/db/queries/kinds";

/**
 * 要記什麼：桌機彈中間，手機從底下推上來。
 *
 * 兩邊清單完全一樣，只有外框不同——內容各寫一份的話，加一個類型就要改兩個地方。
 */

const styles = {
  list: "flex flex-col",
  item: "border-rule text-ui border-b px-4 py-3 last:border-b-0 hover:bg-gray-50",
  sheetBackdrop: "fixed inset-0 z-40 bg-black/20",
  sheet:
    "border-shell-rule fixed right-0 bottom-0 left-0 z-50 flex max-h-[70vh] flex-col overflow-y-auto rounded-t-2xl border-t bg-white pb-[env(safe-area-inset-bottom)]",
};

function KindList({ kinds, onPick }: { kinds: Kind[]; onPick: () => void }) {
  return (
    <div className={styles.list}>
      {kinds.map((kind) => (
        <Link
          key={kind.id}
          href={`${kindHref(kind.group, kind.slug)}/new`}
          onClick={onPick}
          className={styles.item}
        >
          {kind.name}
        </Link>
      ))}
    </div>
  );
}

/** 手機：貼著底部導覽長出來，拇指構得到 */
export function NewRecordSheet({ kinds, onClose }: { kinds: Kind[]; onClose: () => void }) {
  return (
    <>
      <div className={`${styles.sheetBackdrop} md:hidden`} onClick={onClose} />
      <div className={`${styles.sheet} md:hidden`}>
        <KindList kinds={kinds} onPick={onClose} />
      </div>
    </>
  );
}

/** 桌機：置中彈窗，跟站上其他彈窗同一套（Esc 與點背景都關得掉） */
export function NewRecordDialog({ kinds, onClose }: { kinds: Kind[]; onClose: () => void }) {
  return (
    <Dialog title="要記什麼" onClose={onClose}>
      <KindList kinds={kinds} onPick={onClose} />
    </Dialog>
  );
}
