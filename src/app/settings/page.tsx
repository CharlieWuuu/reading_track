"use client";

import { Suspense } from "react";
import { useSession } from "next-auth/react";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { SegmentedControl } from "@/components/ui/controls";
import { SignInPrompt } from "@/components/ui/sign-in-prompt";
import { EnrichButton } from "@/features/books/components/enrich-button";
import { AccountPanel } from "@/features/settings/components/account-panel";
import { CategoryManager } from "@/features/settings/components/category-manager";
import { MaintenancePanel } from "@/features/settings/components/maintenance-panel";
import { SheetConnectPanel } from "@/features/settings/components/sheet-connect-panel";
import { useUrlParams } from "@/hooks/use-url-param";

const TABS = [
  { key: "connect", label: "資料來源" },
  { key: "categories", label: "分類選項" },
  { key: "maintenance", label: "資料維護" },
  { key: "account", label: "帳號" },
] as const;

type SettingsTab = (typeof TABS)[number]["key"];

function Settings() {
  const { data: session } = useSession();
  const { searchParams, setParams } = useUrlParams();
  // 分頁走網址：側欄那顆頭像要指得進「帳號」，上一頁也才回得去
  const param = searchParams.get("tab");
  const tab = (TABS.some((t) => t.key === param) ? param : "connect") as SettingsTab;

  const signedIn = Boolean(session?.user);

  // 頁首畫一次就好，未登入時只是沒有分頁列可切
  return (
    <>
      <PageHeader
        title="設定"
        action={
          signedIn && (
            <SegmentedControl
              items={TABS}
              value={tab}
              onChange={(next) => setParams({ tab: next === "connect" ? null : next })}
            />
          )
        }
      />
      {!signedIn ? (
        <SignInPrompt />
      ) : (
        <PageBody>
          <div className="rounded-surface shrink-0 bg-white p-4 md:min-h-0 md:flex-1 md:overflow-y-auto md:p-5">
            {tab === "connect" && <SheetConnectPanel />}
            {tab === "categories" && <CategoryManager />}
            {tab === "maintenance" && <MaintenancePanel enrichSlot={<EnrichButton />} />}
            {tab === "account" && <AccountPanel />}
          </div>
        </PageBody>
      )}
    </>
  );
}

/** 讀網址參數的元件要有 Suspense 邊界，靜態預先產生才不會失敗 */
export default function SettingsPage() {
  return (
    <Suspense fallback={null}>
      <Settings />
    </Suspense>
  );
}
