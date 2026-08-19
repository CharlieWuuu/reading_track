import { type LucideIcon } from "lucide-react";

/** iOS 的原生日期控制項有自己的最小寬度，不關掉外觀就會撐破手機寬度 */
const DATE_INPUT_CLASS = "appearance-none";
const DATE_TYPES = ["date", "datetime-local", "time"];

export function Field({
  label,
  Icon,
  value,
  onChange,
  onPaste,
  hint,
  type = "text",
}: {
  label: string;
  /** 跟詳細卡片同一個圖示；沒有對應圖示的欄位就不放 */
  Icon?: LucideIcon;
  value: string;
  onChange: (v: string) => void;
  /** 收到貼上的文字。onChange 也照樣會發，這裡只是多給一個「使用者剛貼了東西」的訊號 */
  onPaste?: (text: string) => void;
  /** 標籤旁邊的淡字說明，通常用來講「這一欄可以填什麼」 */
  hint?: string;
  type?: string;
}) {
  return (
    <div className="min-w-0">
      <label className="mb-1 flex items-center gap-1.5 text-sm font-medium">
        {Icon && (
          <Icon size={14} strokeWidth={1.5} className="shrink-0 text-gray-400" aria-hidden />
        )}
        {label}
        {hint && <span className="text-xs font-normal text-gray-400">{hint}</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={onPaste && ((e) => onPaste(e.clipboardData.getData("text")))}
        className={`box-border block w-full max-w-full min-w-0 rounded border px-3 py-2 text-sm ${
          DATE_TYPES.includes(type) ? DATE_INPUT_CLASS : ""
        }`}
      />
    </div>
  );
}
