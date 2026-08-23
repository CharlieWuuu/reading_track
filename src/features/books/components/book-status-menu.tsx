"use client";

import { BookMarked, BookOpen, Check, Library } from "lucide-react";
import { SelectMenu } from "@/components/ui/controls";
import { useUrlParams } from "@/hooks/use-url-param";
import { DEFAULT_STATUS, parseStatusFilter, StatusFilter } from "@/utils/book-filter";

const ICON = { size: 16, strokeWidth: 1.5 } as const;

/** 刻意不顯示數量：「閱讀中 12」那個數字本身就是提醒，切換之前就已經看到了 */
const ITEMS = [
  { key: "done" as const, label: "已讀完", Icon: () => <Check {...ICON} /> },
  { key: "reading" as const, label: "閱讀中", Icon: () => <BookOpen {...ICON} /> },
  { key: "want" as const, label: "想讀", Icon: () => <BookMarked {...ICON} /> },
  { key: "all" as const, label: "全部", Icon: () => <Library {...ICON} /> },
];

/** 書單的狀態篩選。預設已讀完，換頁或重新整理都回到預設 */
export function BookStatusMenu() {
  const { searchParams, setParams } = useUrlParams();
  const status = parseStatusFilter(searchParams.get("status"));

  function select(next: StatusFilter) {
    // 預設值不寫進網址，分享出去的連結才乾淨；換篩選就回第一頁
    setParams({ status: next === DEFAULT_STATUS ? null : next, page: null });
  }

  return <SelectMenu label="狀態" items={ITEMS} value={status} onChange={select} />;
}
