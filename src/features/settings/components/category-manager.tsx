"use client";

import { useState } from "react";
import { Lock, LockOpen } from "lucide-react";
import { PageAside, PageMain } from "@/components/layout/page-body";
import { usePrivacyFlags } from "@/features/settings/api";
import { useCategories } from "@/hooks/use-categories";
import type { PrivacyFlagNode } from "@/lib/db/queries/taxonomy";
import { BookCategories, CATEGORY_FIELDS, CategorySource } from "@/types/book";

type FlatKey = Exclude<keyof BookCategories, "domain" | "subDomain">;
type SectionKey = "domain" | FlatKey;

/** 領域／次領域併進同一棵樹畫，其餘欄位還是純展示的扁平清單 */
const FLAT_LABELS: Record<FlatKey, string> = {
  platform: "平台",
  type: "屬性",
  language: "語言",
  topic: "主題",
};

const SOURCE_LABELS: Record<CategorySource, string> = {
  book: "書籍",
  article: "文章",
  writings: "書寫",
};

/** 小標寫「哪些紀錄・共用這一組｜叫什麼名字」，只列有資料的來源，沒紀錄的不掛名 */
function sectionTitle(
  sources: CategorySource[],
  label: string,
  hasRecords: Record<CategorySource, boolean>,
): string {
  const used = sources.filter((s) => hasRecords[s]);
  return `${(used.length > 0 ? used : sources).map((s) => SOURCE_LABELS[s]).join("・")}｜${label}`;
}

const styles = {
  // 不設上限：主題一列可能有七八個，寬度夠就讓它排完，不要提早折行
  wrap: "flex flex-col gap-6",
  group: "border-rule flex flex-col gap-2 border-b pb-4 last:border-b-0 last:pb-0",
  title: "font-serif text-item-sm font-semibold",
  list: "flex flex-wrap gap-1.5",
  item: "rounded-control border-rule flex items-baseline gap-1.5 border px-2 py-1 text-xs text-ink-muted",
  count: "text-meta text-ink-faint tabular-nums",
  empty: "text-meta text-ink-faint",
  error: "text-meta text-red-600",
  // 手機放不下一整列，子領域換行；縮排是唯一看得出層級的線索
  domainRow: "flex flex-col gap-1.5 md:flex-row md:flex-wrap md:items-center md:gap-4",
  // 四個中文字加鎖頭與數字，96px 會被擠成兩行；下限放寬、內容長就自己撐
  domainName: "min-w-32 shrink-0 whitespace-nowrap",
  children: "flex flex-wrap gap-1.5 pl-4 md:pl-0",
  chip: "rounded-control flex items-center gap-1 border px-2 py-1 text-xs whitespace-nowrap disabled:opacity-40",
  chipOn: "border-accent text-accent",
  chipOff: "border-rule text-ink-muted",
  // 右欄分頁：跟類型分頁那張清單同一種列
  nav: "flex flex-col",
  navItem:
    "border-rule-soft text-ui flex items-baseline justify-between border-b py-[7px] pl-3 text-left",
  navOn: "text-ink font-semibold",
  navOff: "text-ink-muted hover:text-ink",
  mobileTabs: "lg:hidden", // 窄螢幕沒有右欄，分頁放上面
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
  const { categories, counts, hasRecords } = useCategories();
  const { flags, isLoading, error, toggle } = usePrivacyFlags();
  const [busyId, setBusyId] = useState("");
  const [failed, setFailed] = useState("");
  const [section, setSection] = useState<SectionKey>("domain"); // 右欄點到哪一組

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

  // 領域一定在；其餘有用過值的才列，照 FLAT_LABELS 的順序
  const sections: { key: SectionKey; label: string; count: number }[] = [
    { key: "domain", label: "領域", count: flags.types.length },
    ...(Object.keys(FLAT_LABELS) as FlatKey[])
      .filter((key) => categories[key].length > 0)
      .map((key) => ({ key, label: FLAT_LABELS[key], count: categories[key].length })),
  ];
  const current = sections.find((item) => item.key === section) ?? sections[0];

  const tabs = (
    <nav className={styles.nav}>
      {sections.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => setSection(item.key)}
          aria-pressed={item.key === current.key}
          className={`${styles.navItem} ${item.key === current.key ? styles.navOn : styles.navOff}`}
        >
          {item.label}
          <span className={styles.count}>{item.count}</span>
        </button>
      ))}
    </nav>
  );

  const domainBody = isLoading ? (
    <p className={styles.empty}>載入中…</p>
  ) : error ? (
    <p className={styles.error}>{error}</p>
  ) : flags.types.length === 0 ? (
    <p className={styles.empty}>還沒有用過任何值</p>
  ) : (
    flags.types.map((node) => (
      <div key={node.id} className={styles.domainRow}>
        <div className={styles.domainName}>
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
  );

  const flatBody = (key: FlatKey) => (
    <div className={styles.list}>
      {categories[key].map((option) => (
        <span key={option} className={styles.item}>
          {option}
          <span className={styles.count}>{counts[key].get(option) ?? 0}</span>
        </span>
      ))}
    </div>
  );

  return (
    <>
      <PageMain>
        <div className={styles.wrap}>
          <div className={styles.mobileTabs}>{tabs}</div>
          <div className={styles.group}>
            <h4 className={styles.title}>
              {sectionTitle(CATEGORY_FIELDS[current.key].sources, current.label, hasRecords)}
            </h4>
            {current.key === "domain" && failed && <p className={styles.error}>{failed}</p>}
            {current.key === "domain" ? domainBody : flatBody(current.key)}
          </div>
        </div>
      </PageMain>
      <PageAside>{tabs}</PageAside>
    </>
  );
}
