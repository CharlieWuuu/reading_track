"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { NAV_GROUPS } from "@/config/nav";
import { KindGroup } from "@/config/record-kinds";
import { TypeBuilder } from "@/features/settings/components/type-builder";

/** 側欄那三個 + 都連到這裡，group 決定新的類型加在哪一堆 */
function NewKindBody() {
  const group = (useSearchParams().get("group") ?? "records") as KindGroup;
  const nav = NAV_GROUPS.find((g) => g.kindGroup === group);

  return (
    <>
      <PageHeader title="新增類型" size="compact" backHref={nav?.href ?? "/records"} />
      <PageBody>
        <TypeBuilder group={group} groupLabel={nav?.label ?? ""} />
      </PageBody>
    </>
  );
}

export default function NewKindPage() {
  return (
    <Suspense fallback={null}>
      <NewKindBody />
    </Suspense>
  );
}
