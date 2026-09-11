import Link from "next/link";
import { BookOpen, Newspaper, PenLine, Tag } from "lucide-react";
import { resolveView, STATS_TYPES, statsHref, StatsType } from "@/config/stats-views";

/**
 * 統計首頁：四個類型各一張卡，點進去才是圖表。
 *
 * 原本進 /stats 直接被導去書籍圖表，類型只能靠頁首那顆選單切換——
 * 手機上那顆選單縮成純圖示，第一次進來根本看不出還有其他三種可以看。
 * 改成卡片牆，一眼看到有哪些類型，也是手機更好操作的入口。
 */

const ICON = { size: 24, strokeWidth: 1.5 } as const;

const TYPE_ICONS: Record<StatsType, () => React.ReactElement> = {
  books: () => <BookOpen {...ICON} />,
  articles: () => <Newspaper {...ICON} />,
  writing: () => <PenLine {...ICON} />,
  keywords: () => <Tag {...ICON} />,
};

const TYPE_HINTS: Record<StatsType, string> = {
  books: "頁數、進度、閱讀期間",
  articles: "篇數與完成月曆",
  writing: "則數與記下的月曆",
  keywords: "出現的年代、地圖分布",
};

export default function StatsIndexPage() {
  return (
    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 md:p-6">
      {STATS_TYPES.map((type) => {
        const Icon = TYPE_ICONS[type.key];
        return (
          <Link
            key={type.key}
            href={statsHref(type.key, resolveView(type.key, null))}
            className="rounded-surface border-rule-strong flex items-center gap-4 border p-5 transition hover:bg-gray-50"
          >
            <span className="text-accent shrink-0">
              <Icon />
            </span>
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-item font-serif font-semibold">{type.label}</span>
              <span className="text-meta text-ink-faint truncate">{TYPE_HINTS[type.key]}</span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
