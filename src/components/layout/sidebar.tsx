"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { activeNavKey, NAV_GROUPS, NavGroup, NavType } from "@/config/nav";
import { AddKindDialog } from "./add-kind-dialog";

/**
 * 桌機側欄。四個分類各配一條實線小標，底下的類型一行一條細線分隔——
 * 不畫框、不上底色，選中的那一列靠左邊一小段主色的直線表示。
 *
 * 分類標題右邊的 + 是新增類型。統計沒有——那一堆是回頭看，不新增東西。
 */

const styles = {
  nav: "border-shell-rule h-full w-[188px] shrink-0 overflow-y-auto border-r pr-6",
  group: "border-rule-strong flex items-center border-b-2 pt-5 pb-1.5 first:pt-0",
  groupLabel: "font-serif text-ui font-semibold tracking-section",
  // 淡到不搶戲，滑過去才變深——它不是主要動作，是「還可以做這件事」
  add: "text-ink-faint hover:text-ink ml-auto shrink-0 p-0.5",
  row: "border-rule flex items-center gap-2 border-b py-[7px]",
  marker: "h-3.5 w-0.5 shrink-0",
  label: "text-ui truncate",
  labelActive: "font-serif text-item-sm text-ink font-semibold",
  labelIdle: "text-ink-muted",
};

function NavRow({ type, active }: { type: NavType; active: boolean }) {
  return (
    <Link href={type.href} aria-current={active ? "page" : undefined} className={styles.row}>
      <span className={`${styles.marker} ${active ? "bg-accent" : ""}`} />
      <span className={`${styles.label} ${active ? styles.labelActive : styles.labelIdle}`}>
        {type.label}
      </span>
    </Link>
  );
}

function GroupHeading({ group, onAdd }: { group: NavGroup; onAdd: () => void }) {
  return (
    <div className={styles.group}>
      <span className={styles.groupLabel}>{group.label}</span>
      {group.kindGroup && (
        <button
          type="button"
          onClick={onAdd}
          aria-label={`${group.label}／新增類型`}
          className={styles.add}
        >
          <Plus size={14} strokeWidth={1.5} />
        </button>
      )}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const current = activeNavKey(pathname);
  const [adding, setAdding] = useState<NavGroup>();

  return (
    <nav className={styles.nav}>
      {NAV_GROUPS.map((group) => (
        <div key={group.key}>
          <GroupHeading group={group} onAdd={() => setAdding(group)} />
          {group.types.map((type) => (
            <NavRow key={type.key} type={type} active={type.key === current} />
          ))}
        </div>
      ))}

      {adding?.kindGroup && (
        <AddKindDialog
          group={adding.kindGroup}
          groupLabel={adding.label}
          onClose={() => setAdding(undefined)}
        />
      )}
    </nav>
  );
}
