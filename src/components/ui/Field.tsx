import { type LucideIcon } from "lucide-react";

/** iOS 的原生日期控制項有自己的最小寬度，不關掉外觀就會撐破手機寬度 */
const DATE_INPUT_CLASS = "appearance-none";

export function Field({
  label,
  Icon,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  /** 跟詳細卡片同一個圖示；沒有對應圖示的欄位就不放 */
  Icon?: LucideIcon;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="min-w-0">
      <label className="mb-1 flex items-center gap-1.5 text-sm font-medium">
        {Icon && (
          <Icon size={14} strokeWidth={1.5} className="shrink-0 text-gray-400" aria-hidden />
        )}
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`box-border block w-full max-w-full min-w-0 rounded border px-3 py-2 text-sm ${
          type === "date" ? DATE_INPUT_CLASS : ""
        }`}
      />
    </div>
  );
}
