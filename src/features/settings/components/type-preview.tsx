"use client";

import { CoverCard } from "@/components/ui/cover-card/cover-card";
import { FragmentCard } from "@/components/ui/fragment-card/fragment-card";
import { Quote } from "@/components/ui/quote";
import { CARD_STYLES, CardStyle } from "@/config/card-styles";
import { KIND_VIEWS } from "@/config/kind-views";
import { KindGroup } from "@/config/record-kinds";
import { BookViewMode } from "@/stores/use-book-view-store";

/** 編輯中的類型：右欄預覽照這組設定畫 */
export type TypeDraft = {
  group: KindGroup;
  name: string;
  picked: string[];
};

const styles = {
  row: "flex items-center gap-2 py-1.5",
  label: "text-ui text-ink-muted",
  always: "text-ui text-ink-faint", // 概覽沒得取消，褪一階表示不能動
};

/**
 * 有哪幾種檢視。多選，勾了幾種那個類型頁就有幾個選項可切。
 *
 * 概覽列出來但不給取消：那是這個類型的門面，一定有。
 * 統計不在這裡——畫得出圖才有它，由勾了哪些模組決定。
 */
export function KindViewsPicker({
  views,
  onChange,
}: {
  views: BookViewMode[];
  onChange: (views: BookViewMode[]) => void;
}) {
  const toggle = (key: BookViewMode) =>
    onChange(views.includes(key) ? views.filter((v) => v !== key) : [...views, key]);

  return (
    <div className="flex flex-col">
      <label className={styles.row}>
        <input type="checkbox" checked disabled />
        <span className={styles.always}>概覽</span>
      </label>
      {KIND_VIEWS.map((view) => (
        <label key={view.key} className={styles.row}>
          <input
            type="checkbox"
            checked={views.includes(view.key)}
            onChange={() => toggle(view.key)}
          />
          <span className={styles.label}>{view.label}</span>
        </label>
      ))}
    </div>
  );
}

/** 一筆長什麼樣。單選——概覽與卡片牆都讀它，一個類型一種卡片 */
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

/** 依勾選的模組組出示意內容，照類型選的卡片樣式畫——跟清單頁是同一套 */
export function TypePreview({
  name,
  picked,
  cardStyle,
}: Pick<TypeDraft, "name" | "picked"> & { cardStyle: CardStyle }) {
  const has = (key: string) => picked.includes(key);
  const title = name.trim() || "（類型名稱）";
  const body = has("longText") ? "這裡是內文，支援分欄……" : undefined;

  if (cardStyle === "quote") {
    return <Quote text={title} source={has("locator") ? "出處・位置" : undefined} />;
  }

  if (cardStyle === "line") {
    return <div className="text-ui text-ink-muted truncate py-[7px]">{title}</div>;
  }

  if (cardStyle === "cover") {
    const caption = has("longText")
      ? "這裡是內文……"
      : [has("creator") && "作者", has("amount") && "數量"].filter(Boolean).join("・");
    return (
      <CoverCard
        id="preview"
        title={title}
        label="主題" // 綠字放的是主題
        caption={caption || undefined}
        meta={has("startDate") || has("endDate") ? "2026-01-01" : undefined}
        coverUrl={has("cover") ? "" : undefined}
      />
    );
  }

  return (
    <FragmentCard
      title={title}
      label={has("gloss") ? "解釋" : undefined}
      body={body}
      meta={has("locator") ? "出處・位置" : undefined}
      coverUrl={has("cover") ? "" : undefined}
    />
  );
}
