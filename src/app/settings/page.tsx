"use client";

import { useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useSession } from "next-auth/react";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { styles as controlStyles } from "@/components/ui/controls/styles";
import { EnrichButton } from "@/features/books/components/enrich-button";
import { AccountPanel } from "@/features/settings/components/account-panel";
import { CategoryManager } from "@/features/settings/components/category-manager";
import { MaintenancePanel } from "@/features/settings/components/maintenance-panel";
import { useUrlParams } from "@/hooks/use-url-param";

const TABS = [
  { key: "categories", label: "分類選項" },
  { key: "maintenance", label: "資料維護" },
  { key: "account", label: "帳號" },
] as const;

type SettingsTab = (typeof TABS)[number]["key"];

/**
 * 分頁列跟頁首那排純文字連結（概覽／表格／篩選）同一套長相：無框無底色，
 * 選中的只是變粗體。四個分頁常駐顯示，不收成下拉選單。
 */
function SettingsTabs({
  tab,
  onChange,
}: {
  tab: SettingsTab;
  onChange: (next: SettingsTab) => void;
}) {
  return (
    <div className="flex min-w-0 items-center gap-4 overflow-x-auto">
      {TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => onChange(t.key)}
          aria-pressed={t.key === tab}
          className={`${controlStyles.link} ${
            t.key === tab ? controlStyles.linkActive : controlStyles.linkIdle
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Settings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { searchParams, setParams } = useUrlParams();
  // 分頁走網址：側欄那顆頭像要指得進「帳號」，上一頁也才回得去
  const param = searchParams.get("tab");
  const tab = (TABS.some((t) => t.key === param) ? param : "categories") as SettingsTab;

  const signedIn = Boolean(session?.user);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?callbackUrl=${encodeURIComponent("/settings")}`);
    }
  }, [status, router]);

  if (!signedIn) return null;

  return (
    <>
      <PageHeader
        title="設定"
        action={
          <SettingsTabs
            tab={tab}
            onChange={(next) => setParams({ tab: next === "categories" ? null : next })}
          />
        }
      />
      <PageBody>
        <div className="shrink-0 md:min-h-0 md:flex-1 md:overflow-y-auto">
          {tab === "categories" && <CategoryManager />}
          {tab === "maintenance" && <MaintenancePanel enrichSlot={<EnrichButton />} />}
          {tab === "account" && <AccountPanel />}
        </div>
      </PageBody>
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
