"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useState } from "react";
import { Plus } from "lucide-react";
import { kindHref } from "@/config/kind-routes";
import { useKinds } from "@/hooks/use-kinds";
import { Kind } from "@/lib/db/queries/kinds";
import { isNavActive, NAV_ITEMS } from "./nav-items";

/**
 * 手機版底部導覽列。桌機版走側欄（Sidebar），兩邊共用同一份 NAV_ITEMS。
 * 底部留 safe-area，避免被 iPhone 的 home indicator 蓋住。
 *
 * 類型切換不在這裡：那是上面那條 NavKindStrip 在做的事。這裡只切 group。
 */

export function BottomNav() {
  const pathname = usePathname();
  const { kinds } = useKinds();
  const [adding, setAdding] = useState(false);

  return (
    <>
      {adding && <NewRecordSheet kinds={kinds} onClose={() => setAdding(false)} />}
      <nav
        className="border-shell-rule shrink-0 border-t bg-white md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <ul className="flex items-stretch">
          {NAV_ITEMS.map((item) => {
            const active = isNavActive(item, pathname);
            return (
              <Fragment key={item.href}>
                {/* 記一筆是隨時想做的事，放正中間——拇指最好按到的位置 */}
                {item.href === "/writings" && (
                  <li className="flex-1">
                    <button
                      type="button"
                      onClick={() => setAdding(true)}
                      className="text-accent flex w-full flex-col items-center gap-0.5 px-1 py-2 text-[10px]"
                    >
                      <Plus size={20} strokeWidth={1.5} />
                      <span className="leading-none">新增</span>
                    </button>
                  </li>
                )}
                <li className="flex-1">
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex flex-col items-center gap-0.5 px-1 py-2 text-[10px] ${
                      active ? "text-gray-900" : "text-gray-400"
                    }`}
                  >
                    <item.Icon active={active} />
                    <span className="leading-none">{item.label}</span>
                  </Link>
                </li>
              </Fragment>
            );
          })}
        </ul>
      </nav>
    </>
  );
}

/** 點了新增之後從下面推上來的類型清單：要記什麼在這裡選 */
function NewRecordSheet({ kinds, onClose }: { kinds: Kind[]; onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 md:hidden" onClick={onClose} />
      <div className="border-shell-rule fixed right-0 bottom-0 left-0 z-50 flex max-h-[70vh] flex-col overflow-y-auto rounded-t-2xl border-t bg-white pb-[env(safe-area-inset-bottom)] md:hidden">
        {kinds.map((kind) => (
          <Link
            key={kind.id}
            href={`${kindHref(kind.group, kind.slug)}/new`}
            onClick={onClose}
            className="border-rule text-ui border-b px-4 py-3 last:border-b-0"
          >
            {kind.name}
          </Link>
        ))}
      </div>
    </>
  );
}
