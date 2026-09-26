"use client";

import { SegmentedControl } from "@/components/ui/controls/segmented-control";
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
  cardStyle: CardStyle;
  /** 切換畫法。鈕在右欄，選了就在底下看到結果 */
  onCardStyleChange: (style: CardStyle) => void;
  /** 這個類型有哪幾種看法 */
  views: BookViewMode[];
  onViewsChange: (views: BookViewMode[]) => void;
};

/**
 * 有哪幾種看法。多選，勾了幾種那個類型頁就有幾個選項，一種就不顯示選單。
 *
 * 跟畫法是兩層：這裡切的是整頁的版面，畫法決定一筆長什麼樣。
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
      {KIND_VIEWS.map((view) => (
        <label key={view.key} className="flex items-center gap-2 py-1.5">
          <input
            type="checkbox"
            checked={views.includes(view.key)}
            onChange={() => toggle(view.key)}
          />
          <span className="text-ui text-ink-muted">{view.label}</span>
        </label>
      ))}
    </div>
  );
}

/** 畫法的切換鈕。跟預覽擺在一起——選哪一種，底下立刻就是那一種 */
export function CardStylePicker({
  cardStyle,
  onChange,
}: {
  cardStyle: CardStyle;
  onChange: (style: CardStyle) => void;
}) {
  return (
    <SegmentedControl
      size="sm"
      items={CARD_STYLES.map((style) => ({ key: style.key, label: style.label }))}
      value={cardStyle}
      onChange={onChange}
    />
  );
}

/** 依勾選的模組組出示意內容。畫法由類型自己選，跟清單頁真正的畫法是同一套 */
export function TypePreview({
  name,
  picked,
  cardStyle,
}: Pick<TypeDraft, "name" | "picked" | "cardStyle">) {
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
