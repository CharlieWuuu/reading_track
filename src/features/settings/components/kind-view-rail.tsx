"use client";

import { COVER_TILE_GRID, CoverTile } from "@/components/ui/cover-tile/cover-tile";
import { CardStyle } from "@/config/card-styles";
import { viewStates } from "@/config/kind-views";
import { moduleDef } from "@/config/modules";
import {
  CardStylePicker,
  TypeDraft,
  TypePreview,
} from "@/features/settings/components/type-preview";
import { BookViewMode } from "@/stores/use-book-view-store";
import { tableColumns } from "@/utils/kind-table";
import { statsOfModules } from "@/utils/stats/from-modules";

/**
 * 設定頁右欄：有哪幾種檢視，點哪一種就看那一種的樣子與設定。
 *
 * 一顆既是勾選框也是分頁：勾選框說有沒有這種檢視，名字是分頁。
 * 只有表格能手動勾，其餘由模組決定（見 kind-views），勾選框鎖住只顯示結果。
 */

const styles = {
  tabs: "flex flex-wrap gap-x-4 gap-y-2",
  tab: "flex items-center gap-1.5",
  active: "text-label text-accent font-medium",
  idle: "text-label text-ink-faint hover:text-ink",
  list: "flex flex-col",
  item: "border-rule-soft text-ui text-ink-muted border-b py-[7px]",
};

function NameList({ names }: { names: string[] }) {
  return (
    <div className={styles.list}>
      {names.map((name) => (
        <span key={name} className={styles.item}>
          {name}
        </span>
      ))}
    </div>
  );
}

/**
 * 卡片檢視的預覽：跟類型頁同一個書封格。完成的一本寫日期；
 * 有勾開始日期的話多一本進行中的，看得到左上角那顆狀態點。
 */
function CoverTilePreview({ draft }: { draft: TypeDraft }) {
  const title = draft.name.trim() || "（類型名稱）";
  const has = (key: string) => draft.picked.includes(key);
  return (
    <ul className={COVER_TILE_GRID}>
      <li>
        <CoverTile
          title={title}
          coverUrl=""
          status="完成"
          meta={has("endDate") ? "2026-01-01 完成" : "完成"}
        />
      </li>
      {has("startDate") && (
        <li>
          <CoverTile title={title} coverUrl="" status="進行" meta="進行" />
        </li>
      )}
    </ul>
  );
}

export function KindViewRail({
  draft,
  views,
  onViewsChange,
  cardStyle,
  onCardStyleChange,
  tab,
  onTabChange,
}: {
  draft: TypeDraft;
  views: BookViewMode[];
  onViewsChange: (views: BookViewMode[]) => void;
  cardStyle: CardStyle;
  onCardStyleChange: (style: CardStyle) => void;
  tab: BookViewMode;
  onTabChange: (tab: BookViewMode) => void;
}) {
  const modules = draft.picked.map((key) => ({ key, label: moduleDef(key)?.label ?? key }));
  const toggleTable = () =>
    onViewsChange(
      views.includes("table") ? views.filter((v) => v !== "table") : [...views, "table"],
    );

  return (
    <div className="flex flex-col gap-4">
      <div className={styles.tabs}>
        {viewStates(views, draft.picked).map((view) => (
          <span key={view.key} className={styles.tab}>
            <input
              type="checkbox"
              aria-label={view.label}
              checked={view.on}
              disabled={view.locked}
              onChange={toggleTable}
            />
            <button
              type="button"
              onClick={() => onTabChange(view.key)}
              aria-pressed={view.key === tab}
              className={view.key === tab ? styles.active : styles.idle}
            >
              {view.label}
            </button>
          </span>
        ))}
      </div>

      {tab === "overview" && (
        // 一筆長什麼樣：概覽、首頁、日報都照它畫
        <>
          <CardStylePicker cardStyle={cardStyle} onChange={onCardStyleChange} />
          <TypePreview {...draft} cardStyle={cardStyle} />
        </>
      )}
      {tab === "table" && <NameList names={tableColumns(modules).map((c) => c.label)} />}
      {tab === "card" && <CoverTilePreview draft={draft} />}
      {tab === "stats" && (
        <NameList names={statsOfModules(draft.picked).map((spec) => spec.label)} />
      )}
    </div>
  );
}
