import { KindGroup } from "./record-kinds";
import { ReadingTab, readingTabHref } from "./tabs";

/**
 * 導覽的四個分類與底下的類型。分類是「這是哪一種東西」，不是功能選單：
 * 紀錄留下讀了什麼、片段是從紀錄裡摘出來的、專欄是自己寫的、統計是回頭看。
 *
 * 新增一個類型＝這張表多一列，不是多寫一支元件。電影還沒有路由，所以還沒列。
 */

export type NavType = {
  key: string;
  label: string;
  href: string;
  /** 走到這幾條路由也算在這一列上（詳情頁、編輯頁） */
  match: string;
};

export type NavGroup = {
  key: string;
  label: string;
  /** 對到資料庫那一堆。沒有的就沒有「新增類型」——統計是回頭看，不新增東西 */
  kindGroup?: KindGroup;
  /** 這一堆的概覽頁。沒有的話標題就只是標題，點不下去 */
  href?: string;
  types: NavType[];
};

const readingType = (key: ReadingTab, label: string): NavType => ({
  key,
  label,
  href: readingTabHref(key),
  match: readingTabHref(key),
});

export const NAV_GROUPS: NavGroup[] = [
  {
    key: "records",
    label: "紀錄",
    kindGroup: "records",
    href: "/records",
    types: [readingType("books", "書籍"), readingType("articles", "文章")],
  },
  {
    key: "fragments",
    label: "片段",
    kindGroup: "fragments",
    href: "/fragments",
    types: [
      readingType("quotes", "佳句"),
      readingType("vocabulary", "單字"),
      readingType("keywords", "關鍵字"),
    ],
  },
  {
    key: "columns",
    label: "專欄",
    kindGroup: "writings",
    href: "/columns",
    types: [{ key: "writing", label: "書寫", href: "/writing", match: "/writing" }],
  },
];

/**
 * 報頭右側的工具區。統計與設定不是內容類型，不跟三堆並列——
 * 統計是副產品，設定是後台。
 */
export const TOOL_ITEMS: NavType[] = [
  { key: "stats", label: "統計", href: "/stats", match: "/stats" },
  { key: "settings", label: "設定", href: "/settings", match: "/settings" },
];

/** 月曆與總覽共用 /stats 開頭，所以要比對得夠細——長的那條先贏 */
export function activeNavKey(pathname: string): string | null {
  const all = [...NAV_GROUPS.flatMap((group) => group.types), ...TOOL_ITEMS];
  const hit = all
    .filter((type) => pathname === type.match || pathname.startsWith(`${type.match}/`))
    .sort((a, b) => b.match.length - a.match.length)[0];
  return hit?.key ?? null;
}
