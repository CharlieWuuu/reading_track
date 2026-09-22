"use client";

import { SegmentedControl } from "@/components/ui/controls/segmented-control";
import { CoverCard } from "@/components/ui/cover-card/cover-card";
import { FragmentCard } from "@/components/ui/fragment-card/fragment-card";
import { Quote } from "@/components/ui/quote";
import { CARD_STYLES, CardStyle } from "@/config/card-styles";
import { KindGroup } from "@/config/record-kinds";

/** 編輯中的類型：右欄預覽照這組設定畫 */
export type TypeDraft = {
  group: KindGroup;
  name: string;
  picked: string[];
  cardStyle: CardStyle;
  /** 切換畫法。鈕在右欄，選了就在底下看到結果 */
  onCardStyleChange: (style: CardStyle) => void;
};

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
export function TypePreview({ name, picked, cardStyle }: Omit<TypeDraft, "onCardStyleChange">) {
  const has = (key: string) => picked.includes(key);
  const title = name.trim() || "（類型名稱）";
  const body = has("longText") ? "這裡是長文內容，支援分欄……" : undefined;

  if (cardStyle === "quote") {
    return <Quote text={title} source={has("locator") ? "出處・位置" : undefined} />;
  }

  if (cardStyle === "line") {
    return <div className="text-ui text-ink-muted truncate py-[7px]">{title}</div>;
  }

  if (cardStyle === "cover") {
    const caption = has("longText")
      ? "這裡是長文內容……"
      : [has("creator") && "作者／來源人", has("amount") && "量"].filter(Boolean).join("・");
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
