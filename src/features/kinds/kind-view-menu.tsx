"use client";

import { ChartPie, Rows3 } from "lucide-react";
import { SelectMenu } from "@/components/ui/controls";
import { useUrlParams } from "@/hooks/use-url-param";
import { useBookViewStore } from "@/stores/use-book-view-store";

const ITEMS = [
  { key: "list" as const, label: "清單", Icon: () => <Rows3 size={16} strokeWidth={1.5} /> },
  { key: "stats" as const, label: "統計", Icon: () => <ChartPie size={16} strokeWidth={1.5} /> },
];

/**
 * 通用類型頁的清單／統計切換。
 *
 * 跟書籍那顆分開：那邊有概覽與書封，通用清單畫不出來——概覽要月份分組與頭條，
 * 書封要封面。這裡只有兩種，選單就只給兩種，不列畫不出來的東西。
 *
 * 狀態共用 use-book-view-store：從書籍切到自訂類型時，「我在看統計」這件事
 * 應該跟著走，不是每一種類型各記各的。
 */
export function KindViewMenu() {
  const { view: savedView, setView: saveView } = useBookViewStore();
  const { searchParams, setParams } = useUrlParams();
  // 這一頁只認得統計，其餘一律當清單——從書封切過來不該是空白
  const view = (searchParams.get("view") ?? savedView) === "stats" ? "stats" : "list";

  function select(next: "list" | "stats") {
    // 存回去的是共用的那組值，清單對應書籍那邊的概覽
    saveView(next === "stats" ? "stats" : "overview");
    setParams({ view: next === "stats" ? "stats" : null });
  }

  return <SelectMenu bare label="顯示方式" items={ITEMS} value={view} onChange={select} />;
}
