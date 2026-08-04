"use client";

import { usePathname } from "next/navigation";
import { AuthButton } from "@/components/auth/AuthButton";
import { useSidebarStore } from "@/store/useSidebarStore";
import { NAV_ITEMS } from "./navItems";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { NavLink } from "./NavLink";
import { RefreshButton } from "./RefreshButton";

/** 側欄空間夠，用完整名稱；底部導覽列則用短標籤 */
const FULL_LABELS: Record<string, string> = {
  "/books": "書籍紀錄",
  "/articles": "文章紀錄",
};

function CollapseButton({ collapsed, onClick }: { collapsed: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={collapsed ? "展開側欄" : "收合側欄"}
      title={collapsed ? "展開側欄" : "收合側欄"}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-900"
    >
      {collapsed ? <PanelLeftOpen size={18} strokeWidth={1.5} /> : <PanelLeftClose size={18} strokeWidth={1.5} />}
    </button>
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
        {collapsed && <CollapseButton collapsed={collapsed} onClick={toggle} />}
      </div>

      <ul className={`flex-1 space-y-1 overflow-y-auto ${collapsed ? "p-2" : "p-4"}`}>
        {NAV_ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const label = FULL_LABELS[item.href] ?? item.label;
          return (
            <li key={item.href}>
              <NavLink
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
              </NavLink>
            </li>
          );
        })}
      </ul>

      <div
        className={`flex flex-col gap-2 border-t border-gray-900 ${
          collapsed ? "items-center p-2" : "p-4"
        }`}
      >
        {/* 重新整理與收合放在帳號按鈕上面一排，工具類的操作集中在側欄底部 */}
        <div
          className={`flex items-center gap-1 ${
            collapsed ? "flex-col" : "justify-between"
          }`}
        >
          <RefreshButton compact={collapsed} />
          {!collapsed && <CollapseButton collapsed={collapsed} onClick={toggle} />}
        </div>
        <AuthButton compact={collapsed} />
      </div>
    </nav>
  );
}
