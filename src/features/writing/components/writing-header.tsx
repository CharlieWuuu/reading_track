"use client";

import { Newspaper, Plus, Rows3 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ActionButton, SelectMenu } from "@/components/ui/controls";
import { SearchBar } from "@/components/ui/search-bar";
import { kindHref } from "@/config/kind-routes";
import { NAV_GROUPS } from "@/config/nav";
import { WRITING_VIEWS } from "@/features/writing/views";
import { useKinds } from "@/hooks/use-kinds";
import { useUrlParams } from "@/hooks/use-url-param";
import { useWritings } from "@/hooks/use-writings";
import { Writing } from "@/types/writing";

/** 選項只列真的有紀事在用的值，選了才不會篩出一片空白 */
function usedTopics(writings: Writing[]): string[] {
  return [...new Set(writings.map((e) => e.topic).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "zh-Hant"),
  );
}

const ICON = { size: 16, strokeWidth: 1.5 } as const;
/** 預設的那一個排前面，選單打開時第一眼看到的就是現在這個 */
const VIEW_ITEMS = [
  { key: "card" as const, label: "概覽", Icon: () => <Newspaper {...ICON} /> },
  { key: "table" as const, label: "表格", Icon: () => <Rows3 {...ICON} /> },
];

/** 書寫的頁首。跟清單一樣自己讀網址，不用把狀態繞一圈從 page 傳下來 */
export function WritingHeader() {
  const { writings } = useWritings();
  const { kinds } = useKinds();
  const { searchParams, setParams } = useUrlParams();
  const query = searchParams.get("q") ?? "";
  const topic = searchParams.get("topic") ?? "";
  const view = WRITING_VIEWS.parse(searchParams.get("view"));
  const title = kinds.find((k) => k.slug === "writing")?.name;
  const parent = NAV_GROUPS.find((group) => group.kindGroup === "writings")?.label;
  const topicItems = [
    { key: "", label: "全部" },
    ...usedTopics(writings).map((key) => ({ key, label: key })),
  ];

  return (
    <PageHeader
      title={title}
      parent={parent}
      action={
        <div className="flex min-w-0 flex-1 items-center gap-5">
          <SearchBar value={query} onChange={(next) => setParams({ q: next || null })} />
          <SelectMenu
            bare
            label="顯示方式"
            items={VIEW_ITEMS}
            value={view}
            onChange={(next) => setParams({ view: WRITING_VIEWS.toParam(next) })}
          />
          <SelectMenu
            bare
            items={topicItems}
            value={topic}
            label="主題"
            onChange={(next) => setParams({ topic: next || null })}
          />
          <ActionButton href={`${kindHref("writings", "writing")}/new`} label="新增" text="新增">
            <Plus size={16} strokeWidth={2} aria-hidden />
          </ActionButton>
        </div>
      }
    />
  );
}
