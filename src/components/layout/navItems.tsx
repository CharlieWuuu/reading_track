import { CalendarDays, ChartPie, Library, Newspaper, Settings } from "lucide-react";

/** 側欄與底部導覽列共用的導覽項目 */

type IconProps = { active?: boolean };

/**
 * 圖示改用 lucide-react：一整套的筆畫粗細、圓角與視覺重量都一致，
 * 比先前一顆一顆手畫的 SVG 好看也好維護（tree-shaking，只會打包用到的那幾顆）。
 */
export const NAV_ITEMS: Array<{
  href: string;
  label: string;
  exact?: boolean;
  Icon: (props: IconProps) => React.ReactElement;
}> = [
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
  { href: "/calendar", label: "日曆", Icon: () => <CalendarDays size={20} strokeWidth={1.5} /> },
  { href: "/settings", label: "設定", Icon: () => <Settings size={20} strokeWidth={1.5} /> },
];
