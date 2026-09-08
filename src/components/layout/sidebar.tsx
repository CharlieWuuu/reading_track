"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { isBuiltIn, kindHref, kindIdFromPath } from "@/config/kind-routes";
import { activeNavKey, NAV_GROUPS, NavGroup, NavType, TOOL_ITEMS } from "@/config/nav";
import { settingsTabHref } from "@/config/routes";
import { useKinds } from "@/hooks/use-kinds";

/**
 * 桌機側欄。四個分類各配一條實線小標，底下的類型一行一條細線分隔——
 * 不畫框、不上底色，選中的那一列靠字本身的主色表示。
 *
 * 分類標題右邊的 + 是新增類型。統計沒有——那一堆是回頭看，不新增東西。
 *
 * 類型有兩個來源：寫死的那幾條有專屬頁面（書籍有封面牆、關鍵字有維基欄位），
 * 自己新增的從資料庫來、走通用頁。等舊表搬完就只剩後者。
 */

const styles = {
  nav: "border-shell-rule flex h-full w-[188px] shrink-0 flex-col overflow-y-auto border-r pr-6",
  group: "border-rule-strong flex items-center border-b-2 pt-5 pb-1.5 first:pt-0",
  groupLabel: "font-serif text-ui font-semibold tracking-section",
  // 淡到不搶戲，滑過去才變深——它不是主要動作，是「還可以做這件事」
  add: "text-ink-faint hover:text-ink ml-auto shrink-0 p-0.5",
  row: "border-rule flex items-baseline border-b py-[7px]",
  count: "text-meta text-ink-faint ml-auto pl-2 tabular-nums",
  tools: "border-rule-strong mt-auto border-t pt-3",
  toolRow: "flex items-baseline py-[7px]",
  user: "text-meta text-ink-faint flex items-center gap-2 pt-2",
  label: "text-ui truncate",
  labelActive: "font-serif text-item-sm text-accent font-semibold",
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
      {group.kindGroup && (
        <Link
          href={`/kinds/new?group=${group.kindGroup}`}
          aria-label={`${group.label}／新增類型`}
          className={styles.add}
        >
          <Plus size={14} strokeWidth={1.5} />
        </Link>
      )}
    </div>
  );
}

/** 底部的使用者：頭像與名字，點進個人資訊 */
function SidebarUser() {
  const { data: session } = useSession();
  const user = session?.user;
  if (!user) return null;

  const label = user.name ?? user.email ?? "";

  return (
    <Link href={settingsTabHref("account")} className={styles.user}>
      {user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.image} alt="" className="h-5 w-5 shrink-0 rounded-full" />
      ) : (
        <span className="bg-rule h-5 w-5 shrink-0 rounded-full" />
      )}
      <span className="truncate">{label}</span>
    </Link>
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
      {NAV_GROUPS.map((group) => (
        <div key={group.key}>
          <GroupHeading group={group} />
          {[...group.types, ...extraTypes(group)].map((type) => (
            <NavRow
              key={type.key}
              type={type}
              active={type.key === current}
              count={countOf(type.label)}
            />
          ))}
        </div>
      ))}

      <div className={styles.tools}>
        {TOOL_ITEMS.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            aria-current={item.key === current ? "page" : undefined}
            className={styles.toolRow}
          >
            <span
              className={`${styles.label} ${item.key === current ? styles.labelActive : styles.labelIdle}`}
            >
              {item.label}
            </span>
          </Link>
        ))}
        <SidebarUser />
      </div>
    </nav>
  );
}
