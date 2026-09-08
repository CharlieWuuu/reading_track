"use client";

import { use } from "react";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { kindHref } from "@/config/kind-routes";
import { ModuleForm } from "@/features/overview/components/module-form";
import { useCatalogRecord } from "@/hooks/use-catalog-record";
import { useKinds } from "@/hooks/use-kinds";

/**
 * 自訂類型的單筆。詳情與編輯是同一頁——欄位就那幾格，多做一個唯讀版只是多一份要維護的畫面。
 */
export default function RecordPage({
  params,
}: {
  params: Promise<{ id: string; recordId: string }>;
}) {
  const { id, recordId } = use(params);
  const { kinds } = useKinds();
  const { record, isLoading, error } = useCatalogRecord(recordId);
  const kind = kinds.find((k) => k.id === id);

  return (
    <>
      <PageHeader title={record?.values.title ?? ""} size="compact" backHref={kindHref(id)} />
      <PageBody>
        {error ? (
          <PageMessage tone="error">{error}</PageMessage>
        ) : isLoading || !kind || !record ? (
          <PageLoading />
        ) : (
          <ModuleForm kind={kind} recordId={recordId} initial={record.values} />
        )}
      </PageBody>
    </>
  );
}
