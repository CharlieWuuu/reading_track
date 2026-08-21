import { ChartPie, Library, NotebookPen, PenLine, Settings } from "lucide-react";

/**
 * 側欄與底部導覽列共用的導覽項目。兩邊一模一樣——
 * 關鍵字與單字在「筆記」底下，月曆在「統計」底下，桌機也照這個分法。
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
    // 書與文章是兩條路由，導覽上仍然是同一區
    href: "/reading/books",
    label: "閱讀",
    exact: true,
    siblings: ["/reading/articles"],
    Icon: () => <Library size={20} strokeWidth={1.5} />,
  },
  {
    href: "/entries",
    label: "書寫",
    exact: true,
    Icon: () => <PenLine size={20} strokeWidth={1.5} />,
  },
  {
    href: "/notes",
    label: "片段",
    Icon: () => <NotebookPen size={20} strokeWidth={1.5} />,
  },
  { href: "/stats", label: "統計", Icon: () => <ChartPie size={20} strokeWidth={1.5} /> },
  { href: "/settings", label: "設定", Icon: () => <Settings size={20} strokeWidth={1.5} /> },
];
