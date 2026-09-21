import Link from "next/link";
import { PanelLeft } from "lucide-react";
import { useSession } from "next-auth/react";
import { useSidebarStore } from "@/stores/use-sidebar-store";
import { IssueLinks } from "./issue-links";

/**
 * 全寬報頭。報紙的識別就是報頭本身：3px 與 1.4px 兩條線夾著襯線站名，
 * 底下再一條 1.4px，兩端放小字。站名是全站唯一 40px 的字，主從關係從這裡開始。
 */

const styles = {
  frame: "px-4 pt-5 md:px-11",
  side: "flex-1 basis-0 text-meta text-ink-faint tabular-nums",
  row: "flex items-baseline pt-3 pb-1.5",
  title: "font-serif text-site leading-none font-semibold",
};

export function Masthead({ authSlot }: { authSlot: React.ReactNode }) {
  const { collapsed, toggle } = useSidebarStore();
  const { status } = useSession();
  const signedIn = status === "authenticated";

  return (
    <div className={styles.frame}>
      <div className="bg-rule-strong" style={{ height: "var(--stroke-masthead)" }} />
      <div className="bg-rule-strong mt-[3px]" style={{ height: "var(--stroke-solid)" }} />

      <div className={styles.row}>
        <div className={`${styles.side} flex items-center gap-3`}>
          {/* 手機走底部導覽，側欄本來就不出現，這顆只給桌機看；沒登入沒有側欄可收合 */}
          {signedIn && (
            <button
              type="button"
              onClick={toggle}
              aria-pressed={collapsed}
              title={collapsed ? "展開側欄" : "收合側欄"}
              className="text-ink-faint hover:text-ink hidden shrink-0 md:block"
            >
              <PanelLeft size={16} strokeWidth={1.5} aria-hidden />
            </button>
          )}
          {/* 只有桌機放：手機報頭只在首頁出現，而那一頁的「今天」旁邊已經有同一份 */}
          <IssueLinks className="hidden md:flex" />
        </div>
        <div className="min-w-0 flex-1 basis-0 text-center whitespace-nowrap">
          <Link href="/" className={styles.title}>
            Archivum
          </Link>
        </div>
        <div className={`${styles.side} flex items-center justify-end gap-3.5`}>
          {/* 手機的統計／設定／帳號走底部導覽，報頭不重複放一次 */}
          <span className="hidden items-center gap-3.5 md:flex">{authSlot}</span>
        </div>
      </div>

      <div className="bg-rule-strong" style={{ height: "var(--stroke-solid)" }} />
    </div>
  );
}
