import { CalendarDays, ChartPie, Library, Newspaper, Settings } from "lucide-react";

/** 側欄與底部導覽列共用的導覽項目 */

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
  { href: "/stats", label: "統計", Icon: () => <ChartPie size={20} strokeWidth={1.5} /> },
  { href: "/calendar", label: "月曆", Icon: () => <CalendarDays size={20} strokeWidth={1.5} /> },
  { href: "/settings", label: "設定", Icon: () => <Settings size={20} strokeWidth={1.5} /> },
];
