import { FIELD_CONTROL_CLASS, FIELD_ROW_CLASS, FieldLabel } from "@/components/ui/field-label";

/** iOS 的原生日期控制項有自己的最小寬度，不關掉外觀就會撐破手機寬度 */
const DATE_INPUT_CLASS = "appearance-none";
const DATE_TYPES = ["date", "datetime-local", "time"];

export function Field({
  label,
  value,
  onChange,
  onPaste,
  hint,
  type = "text",
  hideLabel = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  /** 收到貼上的文字。onChange 也照樣會發，這裡只是多給一個「使用者剛貼了東西」的訊號 */
  onPaste?: (text: string) => void;
  /** 標籤旁邊的淡字說明，通常用來講「這一欄可以填什麼」 */
  hint?: string;
  type?: string;
  /** 不畫標籤：欄名與說明改寫在框裡當 placeholder，省一行高度 */
  hideLabel?: boolean;
}) {
  return (
    <div className={FIELD_ROW_CLASS}>
      {!hideLabel && <FieldLabel label={label} hint={hint} />}
      <input
        type={type}
        aria-label={label}
        placeholder={hideLabel ? (hint ?? label) : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={onPaste && ((e) => onPaste(e.clipboardData.getData("text")))}
        className={`rounded-control ${FIELD_CONTROL_CLASS} box-border block w-full max-w-full border px-3 py-2 text-sm ${
          DATE_TYPES.includes(type) ? DATE_INPUT_CLASS : ""
        }`}
      />
    </div>
  );
}
