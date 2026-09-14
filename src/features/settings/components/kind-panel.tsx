"use client";

import { useState } from "react";
import { NAV_GROUPS } from "@/config/nav";
import { KindGroup } from "@/config/record-kinds";
import { TypeBuilder } from "@/features/settings/components/type-builder";
import { useKinds } from "@/hooks/use-kinds";

/**
 * 類型的增減。原本掛在三個概覽頁的頁首上（/records/new-kind 那三條），
 * 但增減類型是設定，不是記一筆東西——放在頁首會跟「新增一筆紀錄」混淆。
 *
 * 先選哪一個 group，再看它底下有哪幾種、要不要移除，最後才是新增。
 * group 固定三個，不會有第四個。
 *
 * 移除只是關掉：預設與自訂一視同仁，資料與定義都不動，想再用就重新加回來。
 */

const styles = {
  label: "text-label tracking-label text-ink-faint font-medium uppercase",
  row: "flex items-center gap-4",
  tab: "text-ui py-1",
  active: "font-serif text-ink font-semibold",
  idle: "text-ink-muted hover:text-ink",
  list: "border-rule flex flex-col border-t",
  item: "border-rule flex items-baseline gap-3 border-b py-2",
  name: "text-ui flex-1",
  count: "text-meta text-ink-faint tabular-nums",
  remove:
    "text-meta text-ink-faint hover:text-ink disabled:text-ink-faint/40 disabled:hover:text-ink-faint/40",
  error: "text-meta text-red-700",
  add: "rounded-control border-rule text-ui self-start border px-3 py-1.5 font-medium hover:bg-gray-50",
};

export function KindPanel() {
  const [group, setGroup] = useState<KindGroup>("records");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const { kinds, removeKind } = useKinds();
  const existing = kinds.filter((kind) => kind.group === group);

  async function remove(kindId: string) {
    setRemoving(kindId);
    setError(undefined);
    try {
      await removeKind(kindId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "移除失敗");
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className={styles.label}>哪一個分類</span>
        <div className={styles.row}>
          {NAV_GROUPS.map((nav) => (
            <button
              key={nav.key}
              type="button"
              onClick={() => {
                if (!nav.kindGroup) return;
                setGroup(nav.kindGroup);
                setAdding(false); // 填一半換 group，那份內容對不上新的 group
              }}
              aria-pressed={nav.kindGroup === group}
              className={`${styles.tab} ${nav.kindGroup === group ? styles.active : styles.idle}`}
            >
              {nav.label}
            </button>
          ))}
        </div>
        {existing.length > 0 && (
          <ul className={styles.list}>
            {existing.map((kind) => (
              <li key={kind.id} className={styles.item}>
                <span className={styles.name}>{kind.name}</span>
                <span className={styles.count}>{kind.count}</span>
                <button
                  type="button"
                  onClick={() => remove(kind.id)}
                  disabled={kind.count > 0 || removing === kind.id}
                  // 有資料就不給移除：手動記的東西沒有還原路徑，先清空那一步本身就是確認
                  title={kind.count > 0 ? "還有資料，要先清空才能移除" : undefined}
                  className={styles.remove}
                >
                  移除
                </button>
              </li>
            ))}
          </ul>
        )}
        {error && <span className={styles.error}>{error}</span>}
      </div>

      {/* 表單三段填完才建得出一個類型，攤開來比清單長得多——平常收起來，要加才展開 */}
      {adding ? (
        <TypeBuilder key={group} group={group} onDone={() => setAdding(false)} />
      ) : (
        <button type="button" onClick={() => setAdding(true)} className={styles.add}>
          新增類型
        </button>
      )}
    </div>
  );
}
