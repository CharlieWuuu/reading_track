"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav-items";

/**
 * 手機版底部導覽列。桌機版走側欄（Sidebar），兩邊共用同一份 NAV_ITEMS。
 * 底部留 safe-area，避免被 iPhone 的 home indicator 蓋住。
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="shrink-0 border-t border-gray-900 bg-white md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="flex items-stretch">
        {NAV_ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
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
          );
        })}
      </ul>
    </nav>
  );
}
