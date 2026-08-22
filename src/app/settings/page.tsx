"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { TabBar } from "@/components/ui/controls";
import { SignInPrompt } from "@/components/ui/sign-in-prompt";
import { AuthButton } from "@/features/auth/components/auth-button";
import { EnrichButton } from "@/features/books/components/enrich-button";
import { CategoryManager } from "@/features/settings/components/category-manager";
import { MaintenancePanel } from "@/features/settings/components/maintenance-panel";
import { SheetConnectPanel } from "@/features/settings/components/sheet-connect-panel";

type SettingsTab = "connect" | "categories" | "maintenance";

const TABS: Array<{ key: SettingsTab; label: string }> = [
  { key: "connect", label: "資料來源" },
  { key: "categories", label: "分類選項" },
  { key: "maintenance", label: "資料維護" },
];

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>("connect");
  const { data: session } = useSession();

  if (!session?.user) {
    return (
      <>
        <PageHeader title="設定" />
        <SignInPrompt />
      </>
    );
  }

  return (
    <>
      <PageHeader title="設定" action={<TabBar items={TABS} value={tab} onChange={setTab} />} />
      <PageBody>
        <div className="rounded-surface shrink-0 bg-white p-4 md:min-h-0 md:flex-1 md:overflow-y-auto md:p-5">
          {tab === "connect" && <SheetConnectPanel authSlot={<AuthButton />} />}
          {tab === "categories" && <CategoryManager />}
          {tab === "maintenance" && <MaintenancePanel enrichSlot={<EnrichButton />} />}
        </div>
      </PageBody>
    </>
  );
}
