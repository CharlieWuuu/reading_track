"use client";

import {
  FIELD_CONTROL_CLASS,
  FIELD_INPUT_CLASS,
  FIELD_ROW_CLASS,
  FieldLabel,
} from "@/components/ui/field-label";
import { PRIVATE_MARK } from "@/config/privacy";

/**
 * 標成私人。沒解鎖的時候伺服器不會把這一筆送到瀏覽器——包含統計與月曆。
 *
 * 排版跟其他欄位一樣是「標籤＋控制項」，一整排欄位的左緣才對得齊。
 */
export function PrivateToggle({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const checked = value.trim() === PRIVATE_MARK;
  return (
    <div className={FIELD_ROW_CLASS}>
      <FieldLabel label="私人" />
      <label
        className={`${FIELD_CONTROL_CLASS} ${FIELD_INPUT_CLASS} flex items-center gap-2 text-sm`}
      >
        <input
          type="checkbox"
          aria-label="私人"
          checked={checked}
          onChange={(e) => onChange(e.target.checked ? PRIVATE_MARK : "")}
          className="size-4"
        />
        <span className="text-xs text-gray-400">沒解鎖就不顯示</span>
      </label>
    </div>
  );
}
