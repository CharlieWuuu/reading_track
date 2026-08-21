"use client";

import { usePathname, useRouter } from "next/navigation";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { TabBar } from "@/components/ui/controls";

const TABS = [
  { key: "books", label: "書籍" },
  { key: "articles", label: "文章" },
  { key: "journal", label: "書寫" },
  // 月曆是統計的一種看法，桌機與手機都放在這裡當分頁
  { key: "calendar", label: "月曆" },
] as const;

type Tab = (typeof TABS)[number]["key"];

/** 四個分頁共用的頁首；哪一頁被選中看網址，重新整理或分享連結都回得到同一個畫面 */
export default function StatsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const segment = usePathname().split("/")[2];
  const tab = (TABS.some((t) => t.key === segment) ? segment : "books") as Tab;

  return (
    <>
      <PageHeader
        title="統計"
        action={
          <TabBar items={TABS} value={tab} onChange={(next) => router.push(`/stats/${next}`)} />
        }
      />
      <PageBody>{children}</PageBody>
    </>
  );
}
