"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useSession } from "next-auth/react";
import { useSidebarStore } from "@/store/useSidebarStore";
import { NAV_ITEMS, NavItem } from "./nav-items";
import { PrivacyButton } from "./privacy-button";
import { RefreshButton } from "./refresh-button";

const styles = {
  nav: "flex h-full shrink-0 flex-col border-r border-gray-900 bg-white",
  brand: "flex items-center justify-center gap-1 border-b border-gray-900 px-3 py-4",
  title: "truncate text-lg font-semibold tracking-tight",
  list: "flex-1 space-y-1 overflow-y-auto",
  link: "flex items-center gap-2 rounded px-3 py-2 text-sm",
  linkCollapsed: "justify-center px-0",
  linkActive: "bg-gray-900 text-white",
  linkIdle: "text-gray-700 hover:bg-gray-100",
  footer: "flex flex-col gap-2 border-t border-gray-900",
  tools: "flex items-center gap-1",
  iconButton:
    "flex h-8 w-8 shrink-0 items-center justify-center rounded text-gray-400 hover:bg-gray-100 hover:text-gray-900",
};

/** 側欄空間夠，用完整名稱；底部導覽列則用短標籤 */
const FULL_LABELS: Record<string, string> = {
  "/books": "書籍紀錄",
  "/articles": "文章紀錄",
};

type CollapseButtonProps = {
  collapsed: boolean;
  onClick: () => void;
};

function CollapseButton({ collapsed, onClick }: CollapseButtonProps) {
  const label = collapsed ? "展開側欄" : "收合側欄";
  return (
    <button onClick={onClick} aria-label={label} title={label} className={styles.iconButton}>
      {collapsed ? (
        <PanelLeftOpen size={18} strokeWidth={1.5} />
      ) : (
        <PanelLeftClose size={18} strokeWidth={1.5} />
      )}
    </button>
  );
}

function isActive(item: NavItem, pathname: string) {
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

type NavLinkProps = {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
};

function NavLink({ item, collapsed, active }: NavLinkProps) {
  const label = FULL_LABELS[item.href] ?? item.label; // 側欄空間夠，用完整名稱
  return (
    <li>
      <Link
        href={item.href}
        title={collapsed ? label : undefined}
        className={`${styles.link} ${collapsed ? styles.linkCollapsed : ""} ${
          active ? styles.linkActive : styles.linkIdle
        }`}
      >
        <item.Icon active={active} />
        {!collapsed && label}
      </Link>
    </li>
  );
}

type SidebarProps = {
  /** 帳號按鈕由 app 那層注入：側欄屬於共用層，不該認得 auth 這個 feature */
  authSlot: React.ReactNode;
};

export function Sidebar({ authSlot }: SidebarProps) {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebarStore();
  const { data: session } = useSession();

  // 沒登入就沒有資料可以重抓，按鈕不該出現
  const showRefresh = Boolean(session?.user);

  return (
    <nav className={`${styles.nav} ${collapsed ? "w-16" : "w-56"}`}>
      <div className={styles.brand}>
        {collapsed ? (
          <Image src="/icon.svg" alt="ReadingTrack" width={32} height={32} className="rounded-lg" />
        ) : (
          <span className={styles.title}>ReadingTrack</span>
        )}
      </div>

      <ul className={`${styles.list} ${collapsed ? "p-2" : "p-4"}`}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            collapsed={collapsed}
            active={isActive(item, pathname)}
          />
        ))}
      </ul>

      <div className={`${styles.footer} ${collapsed ? "items-center p-2" : "p-4"}`}>
        {/* 工具類操作固定在帳號按鈕上面一排，收合前後都在同一個位置 */}
        <div
          className={`${styles.tools} ${collapsed ? "flex-col" : "flex-row-reverse justify-between"}`}
        >
          <CollapseButton collapsed={collapsed} onClick={toggle} />
          {showRefresh && <RefreshButton compact={collapsed} />}
          {showRefresh && <PrivacyButton compact={collapsed} />}
        </div>
        {authSlot}
      </div>
    </nav>
  );
}
