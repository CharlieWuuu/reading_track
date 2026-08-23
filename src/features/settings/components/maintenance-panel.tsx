"use client";

import { CachePanel } from "@/features/settings/components/cache-panel";
import { DataIssuesPanel } from "@/features/settings/components/data-issues-panel";
import { ImportNotesButton } from "@/features/settings/components/import-notes-button";

/**
 * 偶爾才會用到的維護動作，放這裡就好，別佔著書單頁的空間。
 *
 * 補資料那顆由 app 那層注入：它是書籍那個 feature 的東西，設定不該認得它
 * （eslint 的 import/no-restricted-paths 也會擋）。理由同 Sidebar 的 authSlot。
 */
export function MaintenancePanel({ enrichSlot }: { enrichSlot: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-xs text-gray-500">
        從網路查書名、作者、書封等資料，補進 Sheet 裡沒填的欄位。 新增一批書之後跑一次就好。
      </p>
      {enrichSlot}

      <div className="mt-6 border-t pt-4">
        <ImportNotesButton />
      </div>

      <div className="mt-6 border-t pt-4">
        <DataIssuesPanel />
      </div>

      <div className="mt-6 border-t pt-4">
        <CachePanel />
      </div>
    </div>
  );
}
