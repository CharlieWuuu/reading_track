"use client";

import { OptionSelect } from "@/components/ui/option-select";
import { useCategories } from "@/hooks/use-categories";
import { BookCategories } from "@/types/book";
import { scopedOptions } from "@/utils/type-tree";

/** 書籍與紀事的分類欄：選項從資料 group 出來，選單本身跟別處共用 */
export function CategorySelect({
  label,
  categoryKey,
  value,
  onChange,
  multiple = false,
  hideLabel = false,
  placeholder,
  parentValue,
}: {
  label: string;
  categoryKey: keyof BookCategories;
  value: string;
  onChange: (value: string) => void;
  multiple?: boolean;
  hideLabel?: boolean;
  /** 不畫標籤時，欄名改由這裡說 */
  placeholder?: string;
  /** 給了就把選項縮到這個父分類底下（次領域傳領域的值）；父值空的就列全部 */
  parentValue?: string;
}) {
  const { categories, counts, children } = useCategories();

  // 舊版本的快取可能沒有這一組（例如剛加上的「平台」），兜底成空陣列
  const all = categories[categoryKey] ?? [];
  const options = parentValue ? scopedOptions(all, children.get(parentValue), value) : all;

  return (
    <OptionSelect
      label={label}
      options={options}
      counts={counts[categoryKey]}
      value={value}
      onChange={onChange}
      multiple={multiple}
      hideLabel={hideLabel}
      placeholder={placeholder}
    />
  );
}
