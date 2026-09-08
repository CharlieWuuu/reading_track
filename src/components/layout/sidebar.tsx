"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isBuiltIn, kindHref, kindIdFromPath, newHref } from "@/config/kind-routes";
import { activeNavKey, NAV_GROUPS, NavGroup, NavType } from "@/config/nav";
import { useKinds } from "@/hooks/use-kinds";

/**
 * 桌機側欄。四個分類各配一條實線小標，底下的類型一行一條細線分隔——
 * 不畫框、不上底色，選中的那一列靠字本身放大變粗表示。
 *
 * 新增類型的入口跟著目前選中的分類走，列在該分類最後一列下方，
 * 文字帶著類型名字（「＋ 新增書籍」）——不是每個分類都放一顆通用的 +。
 *
 * 類型有兩個來源：寫死的那幾條有專屬頁面（書籍有封面牆、關鍵字有維基欄位），
 * 自己新增的從資料庫來、走通用頁。等舊表搬完就只剩後者。
 *
 * 統計／設定／帳號在報頭右側，不在這裡——側欄只放內容類型。
 */

const styles = {
  nav: "border-shell-rule flex h-full w-[188px] shrink-0 flex-col overflow-y-auto border-r pr-6",
  group: "border-rule-strong border-b-2 pt-8 pb-1.5 first:pt-0",
  groupLabel: "font-serif text-ui font-semibold tracking-section",
  row: "border-rule-soft flex items-baseline border-b py-[7px] pl-3",
  count: "text-meta text-ink-faint ml-auto pl-2 tabular-nums",
  label: "text-ui truncate",
  labelActive: "font-serif text-item-sm text-ink font-semibold",
  labelIdle: "text-ink-muted",
  add: "text-accent text-ui block pt-5 pl-3",
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
  const current = activeNavKey(pathname) ?? kindIdFromPath(pathname);
  const { kinds } = useKinds();

  /**
   * 資料庫裡有、側欄還沒寫死的那些，補在該堆後面。
   * 沒有資料的類型不列——沒用過的不佔位置。
   */
  const extraTypes = (group: NavGroup): NavType[] =>
    kinds
      .filter(
        (kind) => kind.group === group.kindGroup && kind.count > 0 && !isBuiltIn(group, kind.name),
      )
      .map((kind) => ({
        key: kind.id,
        label: kind.name,
        href: kindHref(kind.id),
        match: kindHref(kind.id),
      }));

  /** 寫死的那幾列沒有 kindId，只能靠名字對回資料庫的計數 */
  const countOf = (label: string): number | undefined =>
    kinds.find((kind) => kind.name === label)?.count;

  return (
    <nav className={styles.nav}>
      {NAV_GROUPS.map((group) => {
        const types = [...group.types, ...extraTypes(group)];
        const activeType = types.find((type) => type.key === current);
        const addHref = activeType && newHref(activeType.label);

        return (
          <div key={group.key}>
            <GroupHeading group={group} />
            {types.map((type) => (
              <NavRow
                key={type.key}
                type={type}
                active={type.key === current}
                count={countOf(type.label)}
              />
            ))}
            {addHref && (
              <Link href={addHref} className={styles.add}>
                ＋ 新增{activeType.label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
