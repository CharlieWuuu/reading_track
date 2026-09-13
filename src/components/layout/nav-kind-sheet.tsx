"use client";

import Link from "next/link";
import { KindGroup } from "@/config/record-kinds";
import { Kind } from "@/lib/db/queries/kinds";

/**
 * 底部導覽長按之後往上推的類型選單。
 *
 * 原本類型切換畫在頁首標題旁邊（KindTabs），那排字會跟標題與動作搶同一行寬度，
 * 類型一多就只能橫捲。改成從按住的那一格往上長出來：清單有多長就多長，
 * 而且手指本來就在下面。
 *
 * 也放「新增」——想記一筆的時候，要點的正是同一份類型清單。
 */

const styles = {
  backdrop: "fixed inset-0 z-40 bg-black/20 md:hidden",
  sheet:
    "border-shell-rule fixed right-0 bottom-0 left-0 z-50 flex flex-col rounded-t-2xl border-t bg-white pb-[env(safe-area-inset-bottom)] md:hidden",
  head: "border-rule flex items-baseline justify-between border-b px-4 py-3",
  title: "font-serif text-item font-semibold tracking-tight",
  hint: "text-meta text-ink-faint",
  list: "flex max-h-[60vh] flex-col overflow-y-auto",
  row: "border-rule flex items-baseline justify-between border-b px-4 py-3 last:border-b-0",
  name: "text-ui",
  count: "text-meta text-ink-faint tabular-nums",
  add: "text-ui text-accent px-4 py-3 font-medium",
};

export function NavKindSheet({
  group,
  label,
  kinds,
  hrefOf,
  newHrefOf,
  onClose,
}: {
  group: KindGroup;
  label: string;
  kinds: Kind[];
  hrefOf: (kind: Kind) => string;
  newHrefOf: (kind: Kind) => string;
  onClose: () => void;
}) {
  const rows = kinds.filter((kind) => kind.group === group);

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.sheet} role="dialog" aria-label={`${label}的類型`}>
        <div className={styles.head}>
          <span className={styles.title}>{label}</span>
          <span className={styles.hint}>選一種</span>
        </div>
        <div className={styles.list}>
          {rows.map((kind) => (
            <div key={kind.id} className={styles.row}>
              <Link href={hrefOf(kind)} onClick={onClose} className={styles.name}>
                {kind.name}
                <span className={`${styles.count} ml-2`}>{kind.count}</span>
              </Link>
              {/* 想記一筆的時候要點的也是這份清單，不用先進清單頁再找新增 */}
              <Link href={newHrefOf(kind)} onClick={onClose} className={styles.add}>
                新增
              </Link>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
