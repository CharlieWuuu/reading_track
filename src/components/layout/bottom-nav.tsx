"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { kindHref } from "@/config/kind-routes";
import { KindGroup } from "@/config/record-kinds";
import { useKinds } from "@/hooks/use-kinds";
import { Kind } from "@/lib/db/queries/kinds";
import { isNavActive, NAV_ITEMS } from "./nav-items";
import { NavKindSheet } from "./nav-kind-sheet";

/**
 * 手機版底部導覽列。桌機版走側欄（Sidebar），兩邊共用同一份 NAV_ITEMS。
 * 底部留 safe-area，避免被 iPhone 的 home indicator 蓋住。
 *
 * 三個 group 那幾格可以長按：往上推出這個 group 的類型清單（見 NavKindSheet）。
 * 短按還是進概覽頁，長按不跟著跳頁——按住到選單出現就取消那次導覽。
 */

const LONG_PRESS_MS = 400;

/** 哪一格底下有類型可以列。統計與設定沒有 */
const GROUP_OF: Record<string, { group: KindGroup; label: string }> = {
  "/records": { group: "records", label: "紀錄" },
  "/fragments": { group: "fragments", label: "片段" },
  "/writings": { group: "writings", label: "書寫" },
};

export function BottomNav() {
  const pathname = usePathname();
  const { kinds } = useKinds();
  const [sheet, setSheet] = useState<{ group: KindGroup; label: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // 長按已經開了選單，放開手指時那次點擊就不該再跳頁
  const opened = useRef(false);

  function press(href: string) {
    const target = GROUP_OF[href];
    if (!target) return;
    opened.current = false;
    timer.current = setTimeout(() => {
      opened.current = true;
      setSheet(target);
    }, LONG_PRESS_MS);
  }

  function release() {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }

  return (
    <>
      <nav
        className="border-shell-rule shrink-0 border-t bg-white md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="flex items-stretch">
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(item, pathname);
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onPointerDown={() => press(item.href)}
                  onPointerUp={release}
                  onPointerLeave={release}
                  onContextMenu={(e) => e.preventDefault()} // 長按會叫出系統選單，蓋掉我們自己的
                  onClick={(e) => {
                    if (opened.current) e.preventDefault();
                  }}
                  className={`flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] select-none ${
                    active ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  <item.Icon active={active} />
                  <span className="leading-none">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {sheet && (
        <NavKindSheet
          group={sheet.group}
          label={sheet.label}
          kinds={kinds}
          hrefOf={(kind: Kind) => kindHref(kind.group, kind.slug)}
          newHrefOf={(kind: Kind) => `${kindHref(kind.group, kind.slug)}/new`}
          onClose={() => setSheet(null)}
        />
      )}
    </>
  );
}
