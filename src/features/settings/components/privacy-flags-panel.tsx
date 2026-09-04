"use client";

import { useState } from "react";
import { Lock, LockOpen } from "lucide-react";
import { usePrivacyFlags } from "@/features/settings/api";
import type { PrivacyFlagNode } from "@/lib/db/queries/taxonomy";

type Target = "type" | "writingType" | "keyword";
type Flip = (target: Target, node: PrivacyFlagNode) => void;

const styles = {
  wrap: "space-y-5",
  hint: "text-xs text-gray-500",
  group: "flex flex-col gap-1.5",
  title: "text-sm font-medium",
  row: "flex flex-wrap gap-1.5",
  children: "ml-4 flex flex-wrap gap-1.5",
  empty: "text-xs text-gray-400",
  error: "text-xs text-red-600",
  chip: "rounded-control flex items-center gap-1 border px-2 py-1 text-xs disabled:opacity-40",
  on: "border-accent text-accent",
  off: "text-gray-600",
};

function Chip({
  target,
  node,
  busy,
  onFlip,
}: {
  target: Target;
  node: PrivacyFlagNode;
  busy: boolean;
  onFlip: Flip;
}) {
  return (
    <button
      type="button"
      onClick={() => onFlip(target, node)}
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
  target,
  nodes,
  busyId,
  onFlip,
}: {
  title: string;
  target: Target;
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
              <Chip target={target} node={node} busy={busyId === node.id} onFlip={onFlip} />
            </div>
            {node.children.length > 0 && (
              <div className={styles.children}>
                {node.children.map((child) => (
                  <Chip
                    key={child.id}
                    target={target}
                    node={child}
                    busy={busyId === child.id}
                    onFlip={onFlip}
                  />
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

  const flip: Flip = async (target, node) => {
    setBusyId(node.id);
    setFailed("");
    try {
      await toggle(target, node.id, !node.isPrivate);
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
      <p className={styles.hint}>
        標了鎖的類型與關鍵字，沒解鎖時整批不會出現在畫面上——包含統計與月曆，
        而且是伺服器那端就擋掉，不是前端藏起來。標父類型等於標了它底下的每一個分支。
      </p>
      {failed && <p className={styles.error}>{failed}</p>}

      <Group
        title="類型（書與文章）"
        target="type"
        nodes={flags.types}
        busyId={busyId}
        onFlip={flip}
      />
      <Group
        title="類型（書寫）"
        target="writingType"
        nodes={flags.writingTypes}
        busyId={busyId}
        onFlip={flip}
      />
      <Group title="關鍵字" target="keyword" nodes={flags.keywords} busyId={busyId} onFlip={flip} />
    </div>
  );
}
