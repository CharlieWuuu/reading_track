"use client";

import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { NAV_GROUPS } from "@/config/nav";
import { KindGroup } from "@/config/record-kinds";
import { TypeBuilder } from "@/features/settings/components/type-builder";

/** 側欄那三個 + 都連到這裡，group 決定新的類型加在哪一堆 */
export function NewKindPage({ group }: { group: KindGroup }) {
  const nav = NAV_GROUPS.find((g) => g.kindGroup === group);

  return (
    <>
      <PageHeader title="新增類型" parent={nav?.label} backHref={nav?.href ?? "/records"} />
      {/* 左邊表單、右邊示意各自捲，理由同概覽頁的月份格線＋窄欄 */}
      <PageBody scroll={false}>
        <TypeBuilder group={group} />
      </PageBody>
    </>
  );
}
