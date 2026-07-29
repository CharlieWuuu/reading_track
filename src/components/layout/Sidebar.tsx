"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthButton } from "@/components/auth/AuthButton";
import { NAV_ITEMS } from "./navItems";

/** 側欄空間夠，用完整名稱；底部導覽列則用短標籤 */
const FULL_LABELS: Record<string, string> = {
  "/books": "書籍紀錄",
  "/articles": "文章紀錄",
};

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex h-full w-56 shrink-0 flex-col border-r border-gray-900 bg-white">
      <div className="border-b border-gray-900 px-4 py-4">
        <span className="text-lg font-semibold tracking-tight">Reading Track</span>
      </div>

      <ul className="flex-1 space-y-1 overflow-y-auto p-4">
        {NAV_ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-2 rounded px-3 py-2 text-sm ${
                  active
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <item.Icon active={active} />
                {FULL_LABELS[item.href] ?? item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-gray-900 p-4">
        <AuthButton />
      </div>
    </nav>
  );
}
