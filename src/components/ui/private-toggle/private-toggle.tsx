"use client";

import { Lock } from "lucide-react";
import { PRIVATE_MARK } from "@/config/privacy";

/**
 * 標成私人。Sheet 上就是一格「是」，人打開試算表也看得懂。
 *
 * 勾了之後，沒解鎖的時候伺服器不會把這一筆送到瀏覽器——包含統計與月曆。
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
    <label className="rounded-control flex items-center gap-2 self-end border px-3 py-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked ? PRIVATE_MARK : "")}
        className="size-4"
      />
      <Lock size={14} strokeWidth={1.5} className="shrink-0 text-gray-400" />
      私人
      <span className="text-xs text-gray-400">沒解鎖就不顯示</span>
    </label>
  );
}
