"use client";

import { Suspense } from "react";
import { EntryFilter } from "@/components/entries/EntryFilter";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageMessage } from "@/components/layout/PageMessage";
import { ReflectionTimeline } from "@/components/notes/ReflectionTimeline";
import { ActionButton } from "@/components/ui/Controls";
import { entriesToReflections } from "@/lib/reflections";
import { useEntries } from "@/lib/useEntries";
import { useMounted } from "@/lib/useMounted";
import { useUrlParams } from "@/lib/useUrlParam";
import { splitTags } from "@/types/book";
import { Entry } from "@/types/entry";

/** 選項只列真的有紀事在用的值，選了才不會篩出一片空白 */
function usedValues(entries: Entry[], field: "kind" | "domain"): string[] {
  return [...new Set(entries.flatMap((e) => splitTags(e[field])))].sort((a, b) =>
    a.localeCompare(b, "zh-Hant"),
  );
}

function EntriesList() {
  const mounted = useMounted();
  const { entries: allEntries, isLoading, error } = useEntries();
  const { searchParams, setParams } = useUrlParams();

  const kind = searchParams.get("kind") ?? "";
  const domain = searchParams.get("domain") ?? "";

  // 領域的選項跟著類型收斂：選了「工作日誌」就只列工作日誌用過的領域
  const byKind = kind ? allEntries.filter((e) => e.kind === kind) : allEntries;
  const entries = domain ? byKind.filter((e) => splitTags(e.domain).includes(domain)) : byKind;

  const action = (
    <div className="flex min-w-0 items-center gap-2">
      <EntryFilter
        groups={[
          { key: "kind", label: "類型", options: usedValues(allEntries, "kind"), value: kind },
          { key: "domain", label: "領域", options: usedValues(byKind, "domain"), value: domain },
        ]}
        // 換類型時把領域清掉：那個領域在新的類型底下可能一筆都沒有
        onChange={(key, next) =>
          setParams(
            key === "kind" ? { kind: next || null, domain: null } : { domain: next || null },
          )
        }
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
