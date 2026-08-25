"use client";

import { FilterMenu } from "@/components/ui/filter-menu";
import { useUrlParams } from "@/hooks/use-url-param";
import {
  DEFAULT_STATUS,
  parseStatusFilter,
  STATUS_LABELS,
  statusFromLabel,
  statusLabel,
} from "@/utils/book-filter";

/**
 * 書單的狀態篩選。預設全部。
 *
 * 用跟書寫同一顆篩選鍵：窄螢幕只留圖示，頁首那一排本來就擠。
 * 刻意不顯示數量，「閱讀中 12」那個數字本身就是提醒。
 */
export function BookStatusMenu() {
  const { searchParams, setParams } = useUrlParams();
  const status = parseStatusFilter(searchParams.get("status"));

  return (
    <FilterMenu
      groups={[
        { key: "status", label: "閱讀狀態", options: STATUS_LABELS, value: statusLabel(status) },
      ]}
      onChange={(_key, label) => {
        const next = statusFromLabel(label);
        // 預設值不寫進網址
        setParams({ status: next === DEFAULT_STATUS ? null : next, page: null });
      }}
    />
  );
}
