"use client";

import { AlignLeft, Plus, Rows3 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ActionButton, SelectMenu } from "@/components/ui/controls";
import { FilterMenu } from "@/components/ui/filter-menu";
import { SearchBar } from "@/components/ui/search-bar";
import { WRITING_VIEWS } from "@/features/writing/views";
import { useUrlParams } from "@/hooks/use-url-param";
import { useWritings } from "@/hooks/use-writings";
import { splitTags } from "@/types/book";
import { Writing } from "@/types/writing";

/** 選項只列真的有紀事在用的值，選了才不會篩出一片空白 */
function usedKinds(writings: Writing[]): string[] {
  return [...new Set(writings.flatMap((e) => splitTags(e.kind)))].sort((a, b) =>
    a.localeCompare(b, "zh-Hant"),
  );
}

const ICON = { size: 16, strokeWidth: 1.5 } as const;
const VIEW_ITEMS = [
  { key: "table" as const, label: "表格", Icon: () => <Rows3 {...ICON} /> },
  { key: "timeline" as const, label: "時間軸", Icon: () => <AlignLeft {...ICON} /> },
];

/** 書寫的頁首。跟清單一樣自己讀網址，不用把狀態繞一圈從 page 傳下來 */
export function WritingHeader() {
  const { writings } = useWritings();
  const { searchParams, setParams } = useUrlParams();
  const query = searchParams.get("q") ?? "";
  const kind = searchParams.get("kind") ?? "";
  const view = WRITING_VIEWS.parse(searchParams.get("view"));

  return (
    <PageHeader
      title="書寫"
      action={
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <SearchBar value={query} onChange={(next) => setParams({ q: next || null })} />
          <SelectMenu
            iconOnly
            label="顯示方式"
            items={VIEW_ITEMS}
            value={view}
            onChange={(next) => setParams({ view: WRITING_VIEWS.toParam(next) })}
          />
          <FilterMenu
            groups={[{ key: "kind", label: "類型", options: usedKinds(writings), value: kind }]}
            onChange={(key, next) => setParams({ [key]: next || null })}
          />
          <ActionButton href="/writing/new" label="新增">
            <Plus size={16} strokeWidth={2} aria-hidden />
          </ActionButton>
        </div>
      }
    />
  );
}
