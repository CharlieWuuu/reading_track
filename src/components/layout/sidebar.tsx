"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { activeNavKey, NAV_GROUPS, NavType } from "@/config/nav";

/**
 * 桌機側欄。四個分類各配一條實線小標，底下的類型一行一條細線分隔——
 * 不畫框、不上底色，選中的那一列靠左邊一小段主色的直線表示。
 */

const styles = {
  nav: "border-shell-rule h-full w-[188px] shrink-0 overflow-y-auto border-r pr-6",
  group: "border-rule-strong border-b-2 pt-5 pb-1.5 first:pt-0",
  groupLabel: "font-serif text-ui font-semibold tracking-section",
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

export function Sidebar() {
  const pathname = usePathname();
  const current = activeNavKey(pathname);

  return (
    <nav className={styles.nav}>
      {NAV_GROUPS.map((group) => (
        <div key={group.key}>
          <div className={styles.group}>
            <span className={styles.groupLabel}>{group.label}</span>
          </div>
          {group.types.map((type) => (
            <NavRow key={type.key} type={type} active={type.key === current} />
          ))}
        </div>
      ))}
    </nav>
  );
}
