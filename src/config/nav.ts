import { KindGroup } from "./record-kinds";

/**
 * 導覽的四個分類。分類是「這是哪一種東西」，不是功能選單：
 * 紀錄留下讀了什麼、片段是從紀錄裡摘出來的、書寫是自己寫的、統計是回頭看。
 *
 * 底下的類型全部從資料庫來，見 sidebar.tsx。這裡只留分類本身的設定。
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
  /** 對到資料庫那個 group。沒有的就沒有「新增類型」——統計是回頭看，不新增東西 */
  kindGroup?: KindGroup;
  /** 這個 group 的概覽頁。沒有的話標題就只是標題，點不下去 */
  href?: string;
  /**
   * 數量的單位：一「筆」紀錄、一「則」片段、一「篇」書寫。
   *
   * 跟 Kind.amountUnit 是兩回事——那個是內容的份量（頁、分鐘、字），
   * 這個是東西的個數。首頁、概覽、統計都要講「幾個」，講法在這裡定一次。
   */
  unit: string;
  types: NavType[];
};

export const NAV_GROUPS: NavGroup[] = [
  { key: "records", label: "紀錄", kindGroup: "records", href: "/records", unit: "筆", types: [] },
  {
    key: "fragments",
    label: "片段",
    kindGroup: "fragments",
    href: "/fragments",
    unit: "則",
    types: [],
  },
  {
    key: "writings",
    label: "書寫",
    kindGroup: "writings",
    href: "/writings",
    unit: "篇",
    types: [],
  },
];

/** 這個 group 的數量單位。不認得的（統計那種沒有 kindGroup 的）一律「筆」 */
export const unitOfGroup = (group: KindGroup): string =>
  NAV_GROUPS.find((nav) => nav.kindGroup === group)?.unit ?? "筆";

/**
 * 報頭右側的工具區。統計與設定不是內容類型，不跟三個 group 並列——
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
