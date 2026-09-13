"use client";

import { useState } from "react";
import { NAV_GROUPS } from "@/config/nav";
import { KindGroup } from "@/config/record-kinds";
import { TypeBuilder } from "@/features/settings/components/type-builder";
import { useKinds } from "@/hooks/use-kinds";

/**
 * 新增類型。原本掛在三個概覽頁的頁首上（/records/new-kind 那三條），
 * 但新增一種類型是設定，不是記一筆東西——放在頁首會跟「新增一筆紀錄」混淆。
 *
 * 先選要加在哪一個分類，再填內容；分類固定三個，不會有第四個。
 */

const styles = {
  label: "text-label tracking-label text-ink-faint font-medium uppercase",
  row: "flex items-center gap-4",
  tab: "text-ui py-1",
  active: "font-serif text-ink font-semibold",
  idle: "text-ink-muted hover:text-ink",
  existing: "text-meta text-ink-faint",
};

export function KindPanel() {
  const [group, setGroup] = useState<KindGroup>("records");
  const { kinds } = useKinds();
  const existing = kinds.filter((kind) => kind.group === group);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className={styles.label}>加在哪一個分類</span>
        <div className={styles.row}>
          {NAV_GROUPS.map((nav) => (
            <button
              key={nav.key}
              type="button"
              onClick={() => nav.kindGroup && setGroup(nav.kindGroup)}
              aria-pressed={nav.kindGroup === group}
              className={`${styles.tab} ${nav.kindGroup === group ? styles.active : styles.idle}`}
            >
              {nav.label}
            </button>
          ))}
        </div>
        {existing.length > 0 && (
          <span className={styles.existing}>
            已經有：{existing.map((kind) => kind.name).join("、")}
          </span>
        )}
      </div>

      <TypeBuilder key={group} group={group} />
    </div>
  );
}
