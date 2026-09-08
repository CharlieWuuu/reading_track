"use client";

import { use } from "react";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { PageLoading } from "@/components/layout/page-loading";
import { kindHref } from "@/config/kind-routes";
import { ModuleForm } from "@/features/overview/components/module-form";
import { useKinds } from "@/hooks/use-kinds";

/** 自訂類型的新增表單。欄位由那個類型勾的模組決定，不是寫死的 */
export default function NewOfKindPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { kinds, isLoading } = useKinds();
  const kind = kinds.find((k) => k.id === id);

  return (
    <>
      <PageHeader title={kind ? `新增${kind.name}` : ""} size="compact" backHref={kindHref(id)} />
      <PageBody>{isLoading || !kind ? <PageLoading /> : <ModuleForm kind={kind} />}</PageBody>
    </>
  );
}
