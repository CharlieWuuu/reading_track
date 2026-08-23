import { Book, ReadingStatus } from "@/types/book";

export type StatusFilter = "all" | "done" | "reading" | "want";

/**
 * 預設只看讀完的。
 *
 * 打開書單是為了回顧讀過什麼，不是被提醒還有幾本沒讀完——那件事不需要每次
 * 進來都說一次。要看的時候切一下就有，但它不會自己跳出來。
 */
export const DEFAULT_STATUS: StatusFilter = "done";

const STATUS_OF: Record<Exclude<StatusFilter, "all">, ReadingStatus> = {
  done: "已讀完",
  reading: "閱讀中",
  want: "想讀",
};

/** 篩選選單上顯示的就是狀態本身；空字串是「全部」，跟其他篩選一致 */
export const STATUS_LABELS = Object.values(STATUS_OF);

export function statusLabel(status: StatusFilter): string {
  return status === "all" ? "" : STATUS_OF[status];
}

export function statusFromLabel(label: string): StatusFilter {
  const found = (Object.keys(STATUS_OF) as Array<Exclude<StatusFilter, "all">>).find(
    (key) => STATUS_OF[key] === label,
  );
  return found ?? "all";
}

/** 網址上用英文 key：狀態本身是中文，放進網址要編碼，分享出去一長串 */
export function parseStatusFilter(raw: string | null | undefined): StatusFilter {
  if (raw === "all" || raw === "done" || raw === "reading" || raw === "want") return raw;
  return DEFAULT_STATUS;
}

export function matchesStatus(book: Book, status: StatusFilter): boolean {
  return status === "all" || book.status === STATUS_OF[status];
}

/**
 * 正在找東西的時候一律看全部。
 *
 * 想更新一本讀到一半的書時，會先搜書名——這時被狀態擋掉會讓人以為那本書不見了，
 * 還要先想起「喔要先切篩選」。找得到比篩得乾淨重要。
 */
export function effectiveStatus(status: StatusFilter, searching: boolean): StatusFilter {
  return searching ? "all" : status;
}
