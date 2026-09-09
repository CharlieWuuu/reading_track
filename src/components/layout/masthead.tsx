import Link from "next/link";
import { PanelLeft } from "lucide-react";
import { useSidebarStore } from "@/stores/use-sidebar-store";

/**
 * 全寬報頭。報紙的識別就是報頭本身：3px 與 1.4px 兩條線夾著襯線站名，
 * 底下再一條 1.4px，兩端放小字。站名是全站唯一 40px 的字，主從關係從這裡開始。
 */

const styles = {
  frame: "px-4 pt-5 md:px-11",
  side: "flex-1 basis-0 text-meta text-ink-faint tabular-nums",
  row: "flex items-baseline pt-3 pb-1.5",
  title: "font-serif text-site leading-none font-semibold tracking-tight",
};

/**
 * 報頭左上的日期。伺服器與瀏覽器各算一次，跨午夜的那一瞬間會差一天，
 * 但那只是報頭上的一行小字，不值得為它把整層變成 client-only。
 */
function IssueDate() {
  const now = new Date();
  return <span suppressHydrationWarning>{`${now.getMonth() + 1} 月 ${now.getDate()} 日`}</span>;
}

export function Masthead({ authSlot }: { authSlot: React.ReactNode }) {
  const { collapsed, toggle } = useSidebarStore();

  return (
    <div className={styles.frame}>
      <div className="bg-rule-strong" style={{ height: "var(--stroke-masthead)" }} />
      <div className="bg-rule-strong mt-[3px]" style={{ height: "var(--stroke-solid)" }} />

      <div className={styles.row}>
        <div className={`${styles.side} flex items-center gap-3`}>
          {/* 手機走底部導覽，側欄本來就不出現，這顆只給桌機看 */}
          <button
            type="button"
            onClick={toggle}
            aria-pressed={collapsed}
            title={collapsed ? "展開側欄" : "收合側欄"}
            className="text-ink-faint hover:text-ink hidden shrink-0 md:block"
          >
            <PanelLeft size={16} strokeWidth={1.5} aria-hidden />
          </button>
          <IssueDate />
        </div>
        <div className="flex-1 basis-0 text-center whitespace-nowrap">
          <Link href="/" className={styles.title}>
            Archivum
          </Link>
        </div>
        <div className={`${styles.side} flex items-center justify-end gap-3.5`}>{authSlot}</div>
      </div>

      <div className="bg-rule-strong" style={{ height: "var(--stroke-solid)" }} />
    </div>
  );
}
