"use client";

import { SelectMenu } from "@/components/ui/controls";
import { useUrlParams } from "@/hooks/use-url-param";
import { DEFAULT_STATUS, parseStatusFilter, StatusFilter } from "@/utils/book-filter";

const ITEMS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "reading", label: "進行" },
  { key: "want", label: "想要" },
  { key: "done", label: "完成" },
];

/**
 * 書單的狀態篩選。預設全部。
 *
 * 跟頁首其他下拉選單（檢視方式等）共用同一顆 SelectMenu，長相與顏色不用另外對齊。
 * 刻意不顯示數量，「閱讀中 12」那個數字本身就是提醒。
 */
export function BookStatusMenu() {
  const { searchParams, setParams } = useUrlParams();
  const status = parseStatusFilter(searchParams.get("status"));

  return (
    <SelectMenu
      bare
      items={ITEMS}
      value={status}
      label="閱讀狀態"
      onChange={(next) => setParams({ status: next === DEFAULT_STATUS ? null : next, page: null })}
    />
  );
}
