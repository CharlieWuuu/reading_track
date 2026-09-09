"use client";

import { useState } from "react";
import { Lock, LockOpen } from "lucide-react";
import { usePrivacyFlags } from "@/features/settings/api";
import type { PrivacyFlagNode } from "@/lib/db/queries/taxonomy";

type Flip = (node: PrivacyFlagNode) => void;

const styles = {
  wrap: "flex max-w-2xl flex-col gap-6",
  hint: "text-meta text-ink-faint",
  group: "border-rule flex flex-col gap-2 border-b pb-4 last:border-b-0 last:pb-0",
  title: "font-serif text-item-sm font-semibold tracking-wide",
  row: "flex flex-wrap gap-1.5",
  children: "ml-4 flex flex-wrap gap-1.5",
  empty: "text-meta text-ink-faint",
  error: "text-meta text-red-600",
  chip: "rounded-control flex items-center gap-1 border px-2 py-1 text-xs disabled:opacity-40",
  on: "border-accent text-accent",
  off: "border-rule text-ink-muted",
};

function Chip({ node, busy, onFlip }: { node: PrivacyFlagNode; busy: boolean; onFlip: Flip }) {
  return (
    <button
      type="button"
      onClick={() => onFlip(node)}
      disabled={busy}
      aria-pressed={node.isPrivate}
      className={`${styles.chip} ${node.isPrivate ? styles.on : styles.off}`}
    >
      {node.isPrivate ? (
        <Lock size={12} strokeWidth={1.5} />
      ) : (
        <LockOpen size={12} strokeWidth={1.5} />
      )}
      {node.name}
    </button>
  );
}

function Group({
  title,
  nodes,
  busyId,
  onFlip,
}: {
  title: string;
  nodes: PrivacyFlagNode[];
  busyId: string;
  onFlip: Flip;
}) {
  return (
    <div className={styles.group}>
      <h4 className={styles.title}>{title}</h4>
      {nodes.length === 0 ? (
        <p className={styles.empty}>還沒有任何值</p>
      ) : (
        nodes.map((node) => (
          <div key={node.id} className={styles.group}>
            <div className={styles.row}>
              <Chip node={node} busy={busyId === node.id} onFlip={onFlip} />
            </div>
            {node.children.length > 0 && (
              <div className={styles.children}>
                {node.children.map((child) => (
                  <Chip key={child.id} node={child} busy={busyId === child.id} onFlip={onFlip} />
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

/**
 * 標私人的地方。旗標本來只能直接改資料庫。
 *
 * 標在類型上而不是一本一本標：想藏「政治」就標那個節點，底下的子類型跟著藏
 * ——那是讀取時沿樹走出來的，不是把旗標抄下去，所以取消也是立刻生效。
 */
export function PrivacyFlagsPanel() {
  const { flags, isLoading, error, toggle } = usePrivacyFlags();
  const [busyId, setBusyId] = useState("");
  const [failed, setFailed] = useState("");

  const flip: Flip = async (node) => {
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

  if (isLoading) return <p className={styles.hint}>載入中…</p>;
  if (error) return <p className={styles.error}>{error}</p>;

  return (
    <div className={styles.wrap}>
      {/* 解鎖鍵搬去帳號頁了：那顆管的是「我現在要不要看見私人內容」，
          是session層級的個人操作，跟這裡「哪些主題該標私人」是兩件事 */}
      <p className={styles.hint}>
        標了鎖的項目，沒解鎖時整批不會出現在畫面上——包含統計與月曆，而且是伺服器
        那端就擋掉，不是前端藏起來。標一個領域等於標了它底下的每一個次領域。
      </p>
      {failed && <p className={styles.error}>{failed}</p>}

      <Group title="主題" nodes={flags.types} busyId={busyId} onFlip={flip} />
    </div>
  );
}
