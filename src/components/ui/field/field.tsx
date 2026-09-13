import {
  FIELD_CONTROL_CLASS,
  FIELD_INPUT_CLASS,
  FIELD_ROW_CLASS,
  FIELD_TEXTAREA_CLASS,
  FieldLabel,
} from "@/components/ui/field-label";

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
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  /** 收到貼上的文字。onChange 也照樣會發，這裡只是多給一個「使用者剛貼了東西」的訊號 */
  onPaste?: (text: string) => void;
  /** 標籤旁邊的淡字說明，通常用來講「這一欄可以填什麼」 */
  hint?: string;
  /** "textarea" 畫成多行，其餘的值直接給 input 的 type */
  type?: string;
  /** 不畫標籤：欄名與說明改寫在框裡當 placeholder，省一行高度 */
  hideLabel?: boolean;
  /** 多行時的高度，預設 4 行 */
  rows?: number;
}) {
  const shared = `${FIELD_CONTROL_CLASS} box-border block w-full max-w-full text-sm`;
  const placeholder = hideLabel ? (hint ?? label) : undefined;

  if (type === "textarea") {
    return (
      <div className={`${FIELD_ROW_CLASS} md:items-start`}>
        {!hideLabel && <FieldLabel label={label} hint={hint} />}
        <textarea
          aria-label={label}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onPaste={onPaste && ((e) => onPaste(e.clipboardData.getData("text")))}
          rows={rows}
          className={`${shared} ${FIELD_TEXTAREA_CLASS} resize-y`}
        />
      </div>
    );
  }

  return (
    <div className={FIELD_ROW_CLASS}>
      {!hideLabel && <FieldLabel label={label} hint={hint} />}
      <input
        type={type}
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={onPaste && ((e) => onPaste(e.clipboardData.getData("text")))}
        className={`${shared} ${FIELD_INPUT_CLASS} ${
          DATE_TYPES.includes(type) ? DATE_INPUT_CLASS : ""
        }`}
      />
    </div>
  );
}
