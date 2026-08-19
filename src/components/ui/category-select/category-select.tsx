"use client";

import { type LucideIcon } from "lucide-react";
import { OptionSelect } from "@/components/ui/option-select";
import { useCategories } from "@/hooks/useCategories";
import { BookCategories } from "@/types/book";

/** 書籍與紀事的分類欄：選項從資料 group 出來，選單本身跟別處共用 */
export function CategorySelect({
  label,
  Icon,
  categoryKey,
  value,
  onChange,
  multiple = false,
}: {
  label: string;
  Icon?: LucideIcon;
  categoryKey: keyof BookCategories;
  value: string;
  onChange: (value: string) => void;
  multiple?: boolean;
}) {
  const { categories, counts } = useCategories();

  return (
    <OptionSelect
      label={label}
      Icon={Icon}
      // 舊版本的快取可能沒有這一組（例如剛加上的「平台」），兜底成空陣列
      options={categories[categoryKey] ?? []}
      counts={counts[categoryKey]}
      value={value}
      onChange={onChange}
      multiple={multiple}
    />
  );
}
