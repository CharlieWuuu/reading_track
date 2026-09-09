"use client";

import { useState } from "react";
import { Lock, LockOpen } from "lucide-react";
import { usePrivacyFlags } from "@/features/settings/api";
import { useCategories } from "@/hooks/use-categories";
import type { PrivacyFlagNode } from "@/lib/db/queries/taxonomy";
import { BookCategories } from "@/types/book";

/** 領域／次領域併進同一棵樹畫，其餘欄位還是純展示的扁平清單 */
const FLAT_LABELS: Record<Exclude<keyof BookCategories, "domain" | "subDomain">, string> = {
  platform: "平台",
  type: "屬性",
  language: "語言",
  kind: "類型",
};

const styles = {
  wrap: "flex max-w-2xl flex-col gap-6",
  hint: "text-meta text-ink-faint",
  group: "border-rule flex flex-col gap-2 border-b pb-4 last:border-b-0 last:pb-0",
  title: "font-serif text-item-sm font-semibold tracking-wide",
  list: "flex flex-wrap gap-1.5",
  item: "rounded-control border-rule flex items-baseline gap-1.5 border px-2 py-1 text-xs text-ink-muted",
  count: "text-meta text-ink-faint tabular-nums",
  empty: "text-meta text-ink-faint",
  error: "text-meta text-red-600",
  children: "ml-4 flex flex-wrap gap-1.5",
  chip: "rounded-control flex items-center gap-1 border px-2 py-1 text-xs disabled:opacity-40",
  chipOn: "border-accent text-accent",
  chipOff: "border-rule text-ink-muted",
};

/** 領域樹的一個節點：名字、用了幾次、鎖定開關 */
function DomainChip({
  node,
  count,
  busy,
  onFlip,
}: {
  node: PrivacyFlagNode;
  count: number;
  busy: boolean;
  onFlip: (node: PrivacyFlagNode) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onFlip(node)}
      disabled={busy}
      aria-pressed={node.isPrivate}
      className={`${styles.chip} ${node.isPrivate ? styles.chipOn : styles.chipOff}`}
    >
      {node.isPrivate ? (
        <Lock size={12} strokeWidth={1.5} />
      ) : (
        <LockOpen size={12} strokeWidth={1.5} />
      )}
      {node.name}
      <span className={styles.count}>{count}</span>
    </button>
  );
}

/**
 * 分類不再是一份要維護的清單，而是「我實際用過哪些值」。
 *
 * 全部從書、文章、書寫 group 出來，用得多的排前面。想改一個值就去改那筆紀錄，
 * 這裡沒有東西可以編——沒有清單，就不會有「清單跟資料對不上」這回事。
 *
 * 領域／次領域是唯一背後有真正資料表（recordTopics）的分類，所以額外多一顆
 * 鎖定開關：標了鎖的領域，整批紀錄在解鎖前不會出現在畫面上。這顆鍵原本自己
 * 佔一個分頁（私人項目），跟這裡功能重疊太多，併進來就不用兩邊各看一次。
 */
export function CategoryManager() {
  const { categories, counts } = useCategories();
  const { flags, isLoading, error, toggle } = usePrivacyFlags();
  const [busyId, setBusyId] = useState("");
  const [failed, setFailed] = useState("");

  const flip = async (node: PrivacyFlagNode) => {
    setBusyId(node.id);
    setFailed("");
    try {
      await toggle(node.id, !node.isPrivate);
    } catch (err) {
      setFailed(err instanceof Error ? err.message : "寫入失敗");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className={styles.wrap}>
      <p className={styles.hint}>
        這些選項是從你的紀錄裡整理出來的，不是一份要維護的清單。用得多的排前面；
        想改掉某個值，直接改那筆紀錄就好。領域可以標成私人：標了鎖的整批紀錄，
        沒解鎖時不會出現在畫面上，包含統計與月曆，且是伺服器端就擋掉。
      </p>

      <div className={styles.group}>
        <h4 className={styles.title}>領域</h4>
        {failed && <p className={styles.error}>{failed}</p>}
        {isLoading ? (
          <p className={styles.empty}>載入中…</p>
        ) : error ? (
          <p className={styles.error}>{error}</p>
        ) : flags.types.length === 0 ? (
          <p className={styles.empty}>還沒有用過任何值</p>
        ) : (
          flags.types.map((node) => (
            <div key={node.id} className={styles.group}>
              <div className={styles.list}>
                <DomainChip
                  node={node}
                  count={counts.domain.get(node.name) ?? 0}
                  busy={busyId === node.id}
                  onFlip={flip}
                />
              </div>
              {node.children.length > 0 && (
                <div className={styles.children}>
                  {node.children.map((child) => (
                    <DomainChip
                      key={child.id}
                      node={child}
                      count={counts.subDomain.get(child.name) ?? 0}
                      busy={busyId === child.id}
                      onFlip={flip}
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {(Object.keys(FLAT_LABELS) as (keyof typeof FLAT_LABELS)[]).map((key) => (
        <div key={key} className={styles.group}>
          <h4 className={styles.title}>{FLAT_LABELS[key]}</h4>
          {categories[key].length === 0 ? (
            <p className={styles.empty}>還沒有用過任何值</p>
          ) : (
            <div className={styles.list}>
              {categories[key].map((option) => (
                <span key={option} className={styles.item}>
                  {option}
                  <span className={styles.count}>{counts[key].get(option) ?? 0}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
