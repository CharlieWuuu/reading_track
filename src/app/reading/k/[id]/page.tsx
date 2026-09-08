"use client";

import Link from "next/link";
import { use } from "react";
import { Plus } from "lucide-react";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { ActionButton } from "@/components/ui/controls";
import { kindHref } from "@/config/kind-routes";
import { useKindRecords } from "@/hooks/use-kind-records";
import { useKinds } from "@/hooks/use-kinds";

/**
 * 自己新增的類型共用這一頁。內建那幾種還在各自的舊路由上，
 * 等舊表搬完會一條一條收進來。
 */
export default function KindPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { kinds } = useKinds();
  const { records, isLoading, error } = useKindRecords(id);

  const kind = kinds.find((k) => k.id === id);

  return (
    <>
      <PageHeader
        title={kind?.name ?? ""}
        action={
          <ActionButton href={`${kindHref(id)}/new`} label={`新增${kind?.name ?? ""}`}>
            <Plus size={16} strokeWidth={2} aria-hidden />
          </ActionButton>
        }
      />
      <PageBody>
        {error ? (
          <PageMessage tone="error">{error}</PageMessage>
        ) : isLoading ? (
          <PageLoading />
        ) : (
          <ul className="flex flex-col">
            {records.map((record) => (
              <li key={record.id} className="border-rule border-b py-2">
                <Link href={`${kindHref(id)}/${record.id}`} className="text-item-sm">
                  {record.title}
                </Link>
                {record.creator && (
                  <span className="text-ink-muted text-ui ml-2">{record.creator}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </PageBody>
    </>
  );
}
