"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";
import { kindGroupSlugFromPath, kindHref } from "@/config/kind-routes";
import { activeNavKey, NAV_GROUPS, NavGroup, NavType } from "@/config/nav";
import { useKinds } from "@/hooks/use-kinds";
import { Kind } from "@/lib/db/queries/kinds";

/**
 * 桌機側欄。四個分類各配一條實線小標，底下的類型一行一條細線分隔——
 * 不畫框、不上底色，選中的那一列靠字本身放大變粗表示。
 *
 * 三個 group 底下一顆「新增」：記一筆是隨時想做的事，不該先走到某一頁才找得到。
 * 點了展開全部類型，選一種就進那一種的新增頁——入口只有一個，要記什麼在裡面選。
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
  group: "border-rule-strong flex items-baseline justify-between border-b-2 pb-1.5",
  newButton:
    "rounded-control border-rule text-ui mt-2 flex items-center justify-center gap-1 border border-dashed py-2 text-ink-muted hover:bg-gray-50",
  newList: "flex flex-col gap-0.5 pt-1",
  newItem: "text-ui text-ink-muted hover:text-ink py-1 pl-3 text-left",
  groupLabel: "block w-full font-serif text-ui font-semibold tracking-section",
  row: "border-rule-soft flex items-baseline border-b py-[7px] pl-3",
  count: "text-meta text-ink-faint ml-auto pl-2 tabular-nums",
  label: "text-ui truncate",
  labelActive: "font-serif text-item-sm text-ink font-semibold",
  labelIdle: "text-ink-muted",
};

function NavRow({
  type,
  active,
  count,
  unit,
}: {
  type: NavType;
  active: boolean;
  count?: number;
  unit: string;
}) {
  return (
    <Link href={type.href} aria-current={active ? "page" : undefined} className={styles.row}>
      <span className={`${styles.label} ${active ? styles.labelActive : styles.labelIdle}`}>
        {type.label}
      </span>
      {count !== undefined && (
        <span className={styles.count}>
          {count.toLocaleString()} {unit}
        </span>
      )}
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

/** 一顆新增：點了列出全部類型，選一種進那一種的新增頁 */
function NewRecordLink({ kinds }: { kinds: Kind[] }) {
  const [open, setOpen] = useState(false);

  if (kinds.length === 0) return null;

  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)} className={styles.newButton}>
        <Plus size={14} strokeWidth={2} aria-hidden />
        新增
      </button>
      {open && (
        <div className={styles.newList}>
          {kinds.map((kind) => (
            <Link
              key={kind.id}
              href={`${kindHref(kind.group, kind.slug)}/new`}
              onClick={() => setOpen(false)}
              className={styles.newItem}
            >
              {kind.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const currentSlug = activeNavKey(pathname) ?? kindGroupSlugFromPath(pathname)?.slug ?? null;
  const { kinds } = useKinds();

  /**
   * 這個 group 底下所有類型，全部從資料庫來——包含使用者剛新增、還沒有任何資料的那個。
   * 沒有入口就點不進去，沒地方新增第一筆；0 筆不等於不存在。
   */
  // 計數跟著類型一起帶下來，不要再用名字反查——名字跨 group 會撞，find 會撿錯那一個
  const typesOf = (group: NavGroup): (NavType & { count: number })[] =>
    kinds
      .filter((kind) => kind.group === group.kindGroup)
      .map((kind) => ({
        key: kind.slug,
        label: kind.name,
        href: kindHref(kind.group, kind.slug),
        match: kindHref(kind.group, kind.slug),
        count: kind.count,
      }));

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
                  count={type.count}
                  unit={group.unit}
                />
              ))}
            </div>
          );
        })}
        <NewRecordLink kinds={kinds} />
      </nav>
      <div className={styles.rule} />
    </div>
  );
}
