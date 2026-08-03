"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthButton } from "@/components/auth/AuthButton";
import { useSidebarStore } from "@/store/useSidebarStore";
import { NAV_ITEMS } from "./navItems";
import { RefreshButton } from "./RefreshButton";

/** 側欄空間夠，用完整名稱；底部導覽列則用短標籤 */
const FULL_LABELS: Record<string, string> = {
  "/books": "書籍紀錄",
  "/articles": "文章紀錄",
};

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect
        x="2.5"
        y="3.5"
        width="15"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d={collapsed ? "M12.5 3.5v13" : "M7.5 3.5v13"}
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebarStore();

  return (
    <nav
      className={`flex h-full shrink-0 flex-col border-r border-gray-900 bg-white ${
        collapsed ? "w-16" : "w-56"
      }`}
    >
      <div
        className={`flex items-center gap-1 border-b border-gray-900 px-3 py-4 ${
          collapsed ? "justify-center" : "justify-between"
        }`}
      >
        {!collapsed && (
          <span className="truncate text-lg font-semibold tracking-tight">
            ReadingTrack
          </span>
        )}
        <button
          onClick={toggle}
          aria-label={collapsed ? "展開側欄" : "收合側欄"}
          title={collapsed ? "展開側欄" : "收合側欄"}
          className="shrink-0 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
        >
          <CollapseIcon collapsed={collapsed} />
        </button>
      </div>

      <ul className={`flex-1 space-y-1 overflow-y-auto ${collapsed ? "p-2" : "p-4"}`}>
        {NAV_ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const label = FULL_LABELS[item.href] ?? item.label;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-2 rounded px-3 py-2 text-sm ${
                  collapsed ? "justify-center px-0" : ""
                } ${
                  active
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <item.Icon active={active} />
                {!collapsed && label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div
        className={`flex flex-col gap-2 border-t border-gray-900 ${
          collapsed ? "items-center p-2" : "p-4"
        }`}
      >
        <RefreshButton compact={collapsed} />
        <AuthButton compact={collapsed} />
      </div>
    </nav>
  );
}
