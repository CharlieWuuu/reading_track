"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { kindGroupSlugFromPath, kindHref } from "@/config/kind-routes";
import { KindGroup } from "@/config/record-kinds";
import { useKinds } from "@/hooks/use-kinds";

/**
 * 手機版頁首的類型切換，畫在標題後面同一行。桌機不畫——側欄已經在說了。
 *
 * 類型從資料庫來，使用者自己新增的那幾種一樣列在這裡，沒有二等公民。
 * 不放「全部」：左邊的標題就是回到混排那一頁的入口。
 */

const styles = {
  // 跟標題同一行，不是獨立一列——所以不留左右負邊距，觸控高度靠 py-2 撐
  bar: "flex min-w-0 shrink gap-3 overflow-x-auto md:hidden",
  tab: "text-ui shrink-0 whitespace-nowrap py-2",
  active: "font-serif text-ink font-semibold",
  idle: "text-ink-muted",
};

export function KindTabs({ group }: { group: KindGroup }) {
  const pathname = usePathname();
  const currentSlug = kindGroupSlugFromPath(pathname)?.slug ?? null;
  const { kinds } = useKinds();

  const types = kinds.filter((kind) => kind.group === group);
  if (types.length === 0) return null;

  return (
    <nav className={styles.bar}>
      {types.map((kind) => {
        const active = kind.slug === currentSlug;
        return (
          <Link
            key={kind.id}
            href={kindHref(kind.group, kind.slug)}
            aria-current={active ? "page" : undefined}
            className={`${styles.tab} ${active ? styles.active : styles.idle}`}
          >
            {kind.name}
          </Link>
        );
      })}
    </nav>
  );
}
