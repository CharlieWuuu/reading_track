"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { groupBasePath, kindGroupSlugFromPath, kindHref } from "@/config/kind-routes";
import { KindGroup } from "@/config/record-kinds";
import { useKinds } from "@/hooks/use-kinds";

/**
 * 底部導覽列上面那條類型列，橫捲。
 *
 * 原本類型切換藏在長按選單裡（NavKindSheet）：看不見，第一次用不知道有這功能，
 * 而且 iOS 長按連結會先跳自己的預覽彈窗。改成一直攤在那裡，點一下就換。
 *
 * 只在三個 group 底下出現，統計與設定沒有類型可列。
 */

const styles = {
  // 捲軸整條藏起來：留著的話高度會隨「有沒有捲軸」變一次，
  // macOS 設成一律顯示捲動列時更明顯——這一條是導覽，高度不能跳
  strip:
    "border-shell-rule flex gap-1 overflow-x-auto border-t bg-white px-3 py-2 md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
  tab: "text-ui shrink-0 rounded-full px-3 py-1 whitespace-nowrap",
  on: "bg-accent/10 text-accent font-medium",
  off: "text-ink-faint",
  count: "text-meta ml-1 tabular-nums opacity-60",
};

export function NavKindStrip() {
  const pathname = usePathname();
  const { kinds } = useKinds();
  const activeRef = useRef<HTMLAnchorElement>(null);

  const here = kindGroupSlugFromPath(pathname);
  const group = here?.group ?? groupOfBasePath(pathname);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [pathname]);

  if (!group) return null;
  const rows = kinds.filter((kind) => kind.group === group);
  if (rows.length === 0) return null;

  const base = groupBasePath(group);

  return (
    <nav className={styles.strip} aria-label="類型">
      <Link
        href={base}
        ref={here ? undefined : activeRef}
        aria-current={here ? undefined : "page"}
        className={`${styles.tab} ${here ? styles.off : styles.on}`}
      >
        全部
      </Link>
      {rows.map((kind) => {
        const on = here?.slug === kind.slug;
        return (
          <Link
            key={kind.id}
            href={kindHref(kind.group, kind.slug)}
            ref={on ? activeRef : undefined}
            aria-current={on ? "page" : undefined}
            className={`${styles.tab} ${on ? styles.on : styles.off}`}
          >
            {kind.name}
            <span className={styles.count}>{kind.count}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** 概覽頁本身（/records）沒有 slug，kindGroupSlugFromPath 認不出來 */
function groupOfBasePath(pathname: string): KindGroup | null {
  const map: Record<string, KindGroup> = {
    "/records": "records",
    "/fragments": "fragments",
    "/writings": "writings",
  };
  return map[pathname] ?? null;
}
