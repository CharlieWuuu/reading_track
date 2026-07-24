"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/books", label: "書籍紀錄", exact: true },
  { href: "/books/new", label: "新增書籍" },
  { href: "/articles", label: "文章紀錄" },
  { href: "/stats", label: "統計圖表" },
  { href: "/calendar", label: "日曆" },
  { href: "/subscriptions", label: "文章訂閱" },
  { href: "/settings", label: "設定" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-48 shrink-0 border-r bg-white p-4">
      <ul className="space-y-1">
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
    </nav>
  );
}
