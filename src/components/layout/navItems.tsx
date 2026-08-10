import { ChartPie, Library, Newspaper, NotebookPen, Settings } from "lucide-react";

/**
 * 側欄與底部導覽列共用的導覽項目。兩邊一模一樣——
 * 關鍵字與單字在「筆記」底下，月曆在「統計」底下，桌機也照這個分法。
 */

type IconProps = { active?: boolean };

export type NavItem = {
  href: string;
  label: string;
  exact?: boolean;
  Icon: (props: IconProps) => React.ReactElement;
};

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/books",
    label: "書籍",
    exact: true,
    Icon: () => <Library size={20} strokeWidth={1.5} />,
  },
  {
    href: "/articles",
    label: "文章",
    exact: true,
    Icon: () => <Newspaper size={20} strokeWidth={1.5} />,
  },
  {
    href: "/notes",
    label: "筆記",
    Icon: () => <NotebookPen size={20} strokeWidth={1.5} />,
  },
  { href: "/stats", label: "統計", Icon: () => <ChartPie size={20} strokeWidth={1.5} /> },
  { href: "/settings", label: "設定", Icon: () => <Settings size={20} strokeWidth={1.5} /> },
];
