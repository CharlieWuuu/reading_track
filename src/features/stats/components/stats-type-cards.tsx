"use client";

import Link from "next/link";
import { kindHref } from "@/config/kind-routes";
import { NAV_GROUPS } from "@/config/nav";
import { useKinds } from "@/hooks/use-kinds";

/**
 * 每一種類型各一張卡，點進去是那一種的統計檢視（?view=stats）。
 *
 * 統計不再是自己一條路由：一種類型的清單與它的統計是同一批資料的兩種看法。
 *
 * 原本進 /stats 直接被導去書籍圖表，類型只能靠頁首那顆選單切換——手機上那顆
 * 選單縮成純圖示，第一次進來根本看不出還有其他幾種可以看。改成卡片牆。
 *
 * 清單是「我在用哪些類型」，不是寫死的四個：開一種新的就自己出現。
 * 照 group 分段，順序跟側欄同一份（NAV_GROUPS）——這一頁在講的是
 * 「輸入、留存、輸出各有哪些」，那正是 group 的意思。
 *
 * 不放圖示也不放說明：一張卡只有類型名，掃過去就看得完；圖示認不得的
 * 類型只能給一顆通用的，反而讓每張卡看起來一樣。
 *
 * 設定頁的「統計」分頁也是這一份：手機的底部導覽只放得下五格，統計是回頭看的
 * 東西不是每天要點的，入口收進設定，畫面共用同一支元件。
 */
export function StatsTypeCards() {
  const { kinds } = useKinds();

  // 沒有任何類型的 group 不留空段，整段連標題一起不畫
  const sections = NAV_GROUPS.map((nav) => ({
    label: nav.label,
    kinds: kinds.filter((kind) => kind.group === nav.kindGroup),
  })).filter((section) => section.kinds.length > 0);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      {sections.map((section) => (
        <section key={section.label} className="flex flex-col gap-3">
          {/* 字與線的顏色跟側欄的 group 小標同一套，線細一格——這一頁的卡片本身也有框，
              兩道粗線疊在一起太重 */}
          <h2 className="border-rule-strong text-ui border-b pb-1.5 font-serif font-semibold">
            {section.label}
          </h2>
          {/* 手機兩欄。桌機有側欄佔掉 180px，三欄等到 md 才放得下 */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {section.kinds.map((kind) => (
              <Link
                key={kind.id}
                href={`${kindHref(kind.group, kind.slug)}?view=stats`}
                className="rounded-surface border-rule truncate border p-4 text-center transition hover:bg-gray-50"
              >
                <span className="text-item font-serif font-semibold">{kind.name}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
