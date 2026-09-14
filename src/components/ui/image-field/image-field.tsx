"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { FIELD_ROW_CLASS, FieldLabel } from "@/components/ui/field-label";
import { imageSrc, MAX_BYTES } from "@/utils/image-key";

/**
 * 封面圖。選一張就上傳，欄位存的是回來的 key。
 *
 * 舊資料那一欄是外部網址，imageSrc 兩種都認得出來，所以不用先轉存也看得到。
 */

const styles = {
  box: "flex items-center gap-3",
  preview: "h-20 w-14 shrink-0 rounded-control object-cover ring-1 ring-black/10",
  empty:
    "flex h-20 w-14 shrink-0 items-center justify-center rounded-control border border-dashed text-ink-faint",
  actions: "flex min-w-0 flex-col items-start gap-1",
  button:
    "flex h-8 items-center gap-1.5 rounded-control border px-3 text-xs font-medium text-control-ink-secondary hover:bg-control-ghost-hover disabled:opacity-50",
  remove: "text-meta text-ink-faint hover:text-ink",
  error: "text-meta text-red-600",
};

export function ImageField({
  label,
  value,
  onChange,
  hideLabel = false,
}: {
  label: string;
  /** 存起來的那一欄：新的是 key，舊的可能是外部網址 */
  value: string;
  onChange: (value: string) => void;
  hideLabel?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function upload(file: File) {
    setError("");
    if (file.size > MAX_BYTES) return setError("圖片不能超過 5 MB");

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/image", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) return setError(data.error ?? "上傳失敗");
      onChange(data.key);
    } catch {
      setError("上傳失敗，請再試一次");
    } finally {
      setUploading(false);
      // 同一個檔案再選一次也要觸發 change
      if (input.current) input.current.value = "";
    }
  }

  const src = imageSrc(value);

  return (
    <div className={FIELD_ROW_CLASS}>
      {!hideLabel && <FieldLabel label={label} />}
      <div className={styles.box}>
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt="" className={styles.preview} />
        ) : (
          <span className={styles.empty}>
            <ImagePlus size={18} strokeWidth={1.5} aria-hidden />
          </span>
        )}

        <div className={styles.actions}>
          <input
            ref={input}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            aria-label={label}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file);
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => input.current?.click()}
            className={styles.button}
          >
            {uploading ? "上傳中…" : src ? "換一張" : "選圖片"}
          </button>

          {src && !uploading && (
            <button type="button" onClick={() => onChange("")} className={styles.remove}>
              <X size={11} strokeWidth={1.5} aria-hidden className="inline" /> 移除
            </button>
          )}
          {error && <p className={styles.error}>{error}</p>}
        </div>
      </div>
    </div>
  );
}
