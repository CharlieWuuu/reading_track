"use client";

import Link from "next/link";
import { DetailSection } from "@/components/ui/detail";
import { kindHref } from "@/config/kind-routes";
import { unitOfKind } from "@/config/nav";
import { useContentLinks } from "@/hooks/use-content-links";
import { useKinds } from "@/hooks/use-kinds";
import type { Kind } from "@/lib/db/queries/kinds";
import type { Linkable } from "@/types/record";

const styles = {
  list: "divide-rule-soft flex flex-col divide-y",
  row: "truncate py-2 text-sm first:pt-0 last:pb-0 hover:bg-gray-50",
  plain: "truncate py-2 text-sm text-ink-muted first:pt-0 last:pb-0",
};

/**
 * 一個類型一區，照側欄的順序排——側欄怎麼列，詳情頁就怎麼列。
 *
 * kind 給 null 的那一區是「名字對不回任何類型」：資料還在、類型被改名或刪了。
 * 濾掉它等於默默吞掉幾筆資料，所以照樣列出來，只是不給連結。
 */
function groupByKind(
  items: Linkable[],
  kinds: Kind[],
): { kind: Kind | null; name: string; items: Linkable[] }[] {
  const known = kinds
    .map((kind) => ({
      kind,
      name: kind.name,
      items: items.filter((item) => item.kindName === kind.name),
    }))
    .filter((group) => group.items.length > 0);

  const names = new Set(kinds.map((kind) => kind.name));
  const orphans = items.filter((item) => !names.has(item.kindName));
  const byName = new Map<string, Linkable[]>();
  for (const item of orphans)
    byName.set(item.kindName, [...(byName.get(item.kindName) ?? []), item]);

  return [...known, ...[...byName].map(([name, rows]) => ({ kind: null, name, items: rows }))];
}

/**
 * 這一筆跟哪些資料有關。一個類型一區，不分「出處」「關鍵字」那種方向——
 * 關聯落在 links_internal 本來就不分方向，硬要在畫面上分是多出來的概念。
 *
 * 連結靠 kind 的 group 與 slug 組出來；類型查不到的（資料還在、類型被刪了）
 * 只顯示名字不給連結，點了掉到 404 比不能點更糟。
 */
export function RelatedLinks({ recordId }: { recordId: string }) {
  const { linked } = useContentLinks(recordId);
  const { kinds } = useKinds();
  const groups = groupByKind(linked, kinds);

  if (groups.length === 0) return null;

  return (
    <>
      {groups.map(({ kind, name, items }) => (
        <DetailSection key={name} title={name} count={`${items.length} ${unitOfKind(kind ?? {})}`}>
          <div className={styles.list}>
            {items.map((item) =>
              kind ? (
                <Link
                  key={item.id}
                  href={`${kindHref(kind.group, kind.slug)}/${item.id}`}
                  className={styles.row}
                >
                  {item.label}
                </Link>
              ) : (
                <span key={item.id} className={styles.plain}>
                  {item.label}
                </span>
              ),
            )}
          </div>
        </DetailSection>
      ))}
    </>
  );
}
