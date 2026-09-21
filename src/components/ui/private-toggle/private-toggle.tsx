"use client";

import { FIELD_CONTROL_CLASS, FIELD_ROW_CLASS, FieldLabel } from "@/components/ui/field-label";
import { PRIVATE_MARK } from "@/config/privacy";

/**
 * 標成私人。沒解鎖的時候伺服器不會把這一筆送到瀏覽器——包含統計與月曆。
 *
 * 排版跟其他欄位一樣是「標籤＋控制項」，一整排欄位的左緣才對得齊。
 */
export function PrivateToggle({
  value,
  onChange,
  label = "私人",
}: {
  value: string;
  onChange: (value: string) => void;
  /** 通用表單用類型自己給的名字；書籍那些寫死的表單就是「私人」 */
  label?: string;
}) {
  const checked = value.trim() === PRIVATE_MARK;
  return (
    <div className={FIELD_ROW_CLASS}>
      <FieldLabel label={label} />
      {/* 不套 FIELD_INPUT_CLASS：底線標的是「這裡可以寫字」，勾選框寫不了 */}
      <label className={`${FIELD_CONTROL_CLASS} flex items-center py-1.5`}>
        <input
          type="checkbox"
          aria-label={label}
          checked={checked}
          onChange={(e) => onChange(e.target.checked ? PRIVATE_MARK : "")}
          className="accent-accent size-4"
        />
      </label>
    </div>
  );
}
