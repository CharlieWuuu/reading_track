"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { kindGroupSlugFromPath, kindHref } from "@/config/kind-routes";
import { activeNavKey, NAV_GROUPS, NavGroup, NavType } from "@/config/nav";
import { useKinds } from "@/hooks/use-kinds";

/**
 * 桌機側欄。四個分類各配一條實線小標，底下的類型一行一條細線分隔——
 * 不畫框、不上底色，選中的那一列靠字本身放大變粗表示。
 *
 * 新增的入口在該類型頁面自己的 page header 上，側欄不重複放一個。
 *
 * 類型全部從資料庫來，網址統一 kindHref(group, slug)。內建類型的專屬頁面
 * 由通用路由內的 variant registry 決定要不要換皮，側欄不用管。
 *
 * 統計／設定／帳號在報頭右側，不在這裡——側欄只放內容類型。
 */

const styles = {
  frame: "flex h-full shrink-0 gap-6",
  nav: "flex h-full w-[180px] shrink-0 flex-col overflow-y-auto gap-6",
  rule: "bg-shell-rule w-px shrink-0",
  group: "border-rule-strong border-b-2 pb-1.5",
  groupLabel: "block w-full font-serif text-ui font-semibold tracking-section",
  row: "border-rule-soft flex items-baseline border-b py-[7px] pl-3",
  count: "text-meta text-ink-faint ml-auto pl-2 tabular-nums",
  label: "text-ui truncate",
  labelActive: "font-serif text-item-sm text-ink font-semibold",
  labelIdle: "text-ink-muted",
};

function NavRow({ type, active, count }: { type: NavType; active: boolean; count?: number }) {
  return (
    <Link href={type.href} aria-current={active ? "page" : undefined} className={styles.row}>
      <span className={`${styles.label} ${active ? styles.labelActive : styles.labelIdle}`}>
        {type.label}
      </span>
      {count ? <span className={styles.count}>{count.toLocaleString()}</span> : null}
    </Link>
  );
}

function GroupHeading({ group }: { group: NavGroup }) {
  return (
    <div className={styles.group}>
      {group.href ? (
        <Link href={group.href} className={styles.groupLabel}>
          {group.label}
        </Link>
      ) : (
        <span className={styles.groupLabel}>{group.label}</span>
      )}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const currentSlug = activeNavKey(pathname) ?? kindGroupSlugFromPath(pathname)?.slug ?? null;
  const { kinds } = useKinds();

  /**
   * 該堆底下所有類型，全部從資料庫來——包含使用者剛新增、還沒有任何資料的那個。
   * 沒有入口就點不進去，沒地方新增第一筆；0 筆不等於不存在。
   */
  const typesOf = (group: NavGroup): NavType[] =>
    kinds
      .filter((kind) => kind.group === group.kindGroup)
      .map((kind) => ({
        key: kind.slug,
        label: kind.name,
        href: kindHref(kind.group, kind.slug),
        match: kindHref(kind.group, kind.slug),
      }));

  const countOf = (label: string): number | undefined =>
    kinds.find((kind) => kind.name === label)?.count;

  return (
    <div className={styles.frame}>
      <nav className={styles.nav}>
        {NAV_GROUPS.map((group) => {
          const types = typesOf(group);

          return (
            <div key={group.key}>
              <GroupHeading group={group} />
              {types.map((type) => (
                <NavRow
                  key={type.key}
                  type={type}
                  active={type.key === currentSlug}
                  count={countOf(type.label)}
                />
              ))}
            </div>
          );
        })}
      </nav>
      <div className={styles.rule} />
    </div>
  );
}
