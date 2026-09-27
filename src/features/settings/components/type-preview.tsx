"use client";

import { KindCard } from "@/components/ui/kind-cards/kind-cards";
import { CARD_STYLES, CardStyle } from "@/config/card-styles";
import { KindGroup } from "@/config/kind-groups";

/** 編輯中的類型：右欄預覽照這組設定畫 */
export type TypeDraft = {
  group: KindGroup;
  name: string;
  picked: string[];
};

const styles = {
  row: "flex items-center gap-2 py-1.5",
  label: "text-ui text-ink-muted",
};

/** 一筆長什麼樣。單選——概覽、首頁、日報都照它畫，一個類型一種 */
export function CardStylePicker({
  cardStyle,
  onChange,
}: {
  cardStyle: CardStyle;
  onChange: (style: CardStyle) => void;
}) {
  return (
    <div className="flex flex-col">
      {CARD_STYLES.map((style) => (
        <label key={style.key} className={styles.row}>
          <input
            type="radio"
            name="card-style"
            checked={cardStyle === style.key}
            onChange={() => onChange(style.key)}
          />
          <span className={styles.label}>{style.label}</span>
        </label>
      ))}
    </div>
  );
}

/**
 * 依勾選的模組組出示意內容，照類型選的卡片樣式畫——跟清單頁同一支 KindCard，
 * 預覽長什麼樣，清單就長什麼樣。
 */
export function TypePreview({
  name,
  picked,
  cardStyle,
}: Pick<TypeDraft, "name" | "picked"> & { cardStyle: CardStyle }) {
  const has = (key: string) => picked.includes(key);
  const title = name.trim() || "（類型名稱）";

  return (
    // 示意用，不給點
    <div className="pointer-events-none">
      <KindCard
        style={cardStyle}
        data={{
          id: "preview",
          href: "",
          title,
          label: has("translation") ? "解釋" : "",
          tag: "主題",
          body: has("longText") ? "這裡是內文，支援分欄……" : "",
          detail: has("pronunciation") ? "發音" : "",
          creator: has("creator") ? "作者" : "",
          platform: has("platform") ? "平台" : "",
          meta: has("locator")
            ? "出處・位置"
            : [has("creator") && "作者", has("amount") && "數量"].filter(Boolean).join("・"),
          date: has("startDate") || has("endDate") ? "2026-01-01" : "",
          topic: title,
          keywords: has("tags") ? ["標籤"] : [],
          coverUrl: "",
          coverTitle: title,
        }}
      />
    </div>
  );
}
