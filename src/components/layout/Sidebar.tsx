"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthButton } from "@/components/auth/AuthButton";

const NAV_ITEMS = [
  { href: "/books", label: "書籍紀錄", exact: true },
  { href: "/books/new", label: "新增書籍" },
  { href: "/stats", label: "書籍統計" },
  { href: "/articles", label: "文章紀錄", exact: true },
  { href: "/articles/stats", label: "文章統計" },
  { href: "/calendar", label: "日曆" },
  { href: "/subscriptions", label: "文章訂閱" },
  { href: "/settings", label: "設定" },
];

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
                className={`block rounded px-3 py-2 text-sm ${
                  active
                    ? "bg-gray-900 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {item.label}
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
