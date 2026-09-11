import { ChartPie, Library, PenLine, Settings, Sparkles } from "lucide-react";

/**
 * 底部導覽列的項目。跟桌機側欄（NAV_GROUPS + TOOL_ITEMS，見 config/nav.ts）
 * 分開維護——側欄是可捲動的完整清單，底部只放得下五格，是側欄的精簡版，
 * 不是同一份資料硬塞兩種畫法，兩邊各自照自己的空間限制決定要列哪些。
 */

type IconProps = { active?: boolean };

export type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
  /** 同一區的兄弟路由，走到那裡也要亮（書與文章是兩條路由、同一個「閱讀」） */
  siblings?: string[];
  Icon: (props: IconProps) => React.ReactElement;
};

/** 側欄與底部導覽列共用同一套判斷，不然兩邊會慢慢長歪 */
export function isNavActive(item: NavItem, pathname: string) {
  if (item.siblings?.some((href) => pathname === href || pathname.startsWith(`${href}/`))) {
    return true;
  }
  return item.exact ? pathname === item.href : pathname.startsWith(item.href);
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/records",
    label: "紀錄",
    Icon: () => <Library size={20} strokeWidth={1.5} />,
  },
  {
    // 之前跟「紀錄」共用一格（靠 siblings 讓紀錄連帶亮），手機沒有直接入口點得進來
    href: "/fragments",
    label: "片段",
    Icon: () => <Sparkles size={20} strokeWidth={1.5} />,
  },
  {
    href: "/writings",
    label: "專欄",
    Icon: () => <PenLine size={20} strokeWidth={1.5} />,
  },
  { href: "/stats", label: "統計", Icon: () => <ChartPie size={20} strokeWidth={1.5} /> },
  { href: "/settings", label: "設定", Icon: () => <Settings size={20} strokeWidth={1.5} /> },
];
