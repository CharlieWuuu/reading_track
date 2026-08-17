"use client";

import { Suspense } from "react";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageMessage } from "@/components/layout/PageMessage";
import { ReflectionTimeline } from "@/components/notes/ReflectionTimeline";
import { ActionButton, TabBar } from "@/components/ui/Controls";
import { entriesToReflections } from "@/lib/reflections";
import { useCategories } from "@/lib/useCategories";
import { useEntries } from "@/lib/useEntries";
import { useMounted } from "@/lib/useMounted";
import { useUrlParams } from "@/lib/useUrlParam";

function EntriesList() {
  const mounted = useMounted();
  const { entries: allEntries, isLoading, error } = useEntries();
  const { categories } = useCategories();
  const { searchParams, setParams } = useUrlParams();

  // 分頁列直接由「類型」的選項長出來，加一種類型不用改程式
  const kinds = categories.kind;
  const param = searchParams.get("kind");
  const kind = param && kinds.includes(param) ? param : "all";
  const filters = [{ key: "all", label: "全部" }, ...kinds.map((k) => ({ key: k, label: k }))];
  const entries = kind === "all" ? allEntries : allEntries.filter((e) => e.kind === kind);

  const action = (
    <div className="flex min-w-0 items-center gap-2">
      <TabBar
        items={filters}
        value={kind}
        onChange={(next) => setParams({ kind: next === "all" ? null : next })}
      />
      <ActionButton href="/entries/new">新增紀事</ActionButton>
    </div>
  );
  if (!mounted) return null;

  if (isLoading || error || entries.length === 0) {
    return (
      <>
        <PageHeader title="紀事" action={action} />
        <PageMessage tone={error ? "error" : "muted"}>
          {isLoading ? "載入中…" : error || "符合條件的紀事是空的"}
        </PageMessage>
      </>
    );
  }

  return (
    <>
      <PageHeader title="紀事" action={action} />
      <PageBody>
        {/* 沒寫心得的也要看得到：這裡是紀事本身的清單 */}
        <ReflectionTimeline reflections={entriesToReflections(entries, false)} />
      </PageBody>
    </>
  );
}

/** 底下讀網址參數的元件要有 Suspense 邊界，靜態預先產生才不會失敗 */
export default function EntriesPage() {
  return (
    <Suspense fallback={null}>
      <EntriesList />
    </Suspense>
  );
}
