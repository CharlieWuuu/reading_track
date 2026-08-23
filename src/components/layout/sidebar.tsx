"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useSidebarStore } from "@/stores/use-sidebar-store";
import { isNavActive, NAV_ITEMS, NavItem } from "./nav-items";

const styles = {
  nav: "flex h-full shrink-0 flex-col border-r border-rule-strong bg-white",
  brand: "flex items-center justify-center gap-1 border-b border-rule-strong px-3 py-4",
  title: "truncate text-lg font-semibold tracking-tight",
  list: "flex-1 space-y-1 overflow-y-auto",
  link: "flex items-center gap-2 rounded-control px-3 py-2 text-sm",
  linkCollapsed: "justify-center px-0",
  linkActive: "bg-control-bg text-control-ink",
  linkIdle: "text-gray-700 hover:bg-gray-100",
  footer: "flex flex-col gap-2 border-t border-rule-strong",
  tools: "flex items-center gap-1",
  iconButton:
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-control text-gray-400 hover:bg-gray-100 hover:text-gray-900",
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

type NavLinkProps = {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
};

function NavLink({ item, collapsed, active }: NavLinkProps) {
  return (
    <li>
      <Link
        href={item.href}
        title={collapsed ? item.label : undefined}
        className={`${styles.link} ${collapsed ? styles.linkCollapsed : ""} ${
          active ? styles.linkActive : styles.linkIdle
        }`}
      >
        <item.Icon active={active} />
        {!collapsed && item.label}
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

  return (
    <nav className={`${styles.nav} ${collapsed ? "w-16" : "w-48"}`}>
      <div className={styles.brand}>
        {collapsed ? (
          <Image
            src="/icon.svg"
            alt="Archivum"
            width={32}
            height={32}
            className="rounded-surface"
          />
        ) : (
          <span className={styles.title}>Archivum</span>
        )}
      </div>

      <ul className={`${styles.list} ${collapsed ? "p-2" : "p-4"}`}>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            collapsed={collapsed}
            active={isNavActive(item, pathname)}
          />
        ))}
      </ul>

      <div className={`${styles.footer} ${collapsed ? "items-center p-2" : "p-4"}`}>
        <div className={`${styles.tools} ${collapsed ? "justify-center" : "justify-end"}`}>
          <CollapseButton collapsed={collapsed} onClick={toggle} />
        </div>
        {authSlot}
      </div>
    </nav>
  );
}
