"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { CardMasonry } from "@/components/ui/card-masonry";
import { ActionButton } from "@/components/ui/controls";
import { FragmentCard } from "@/components/ui/fragment-card/fragment-card";
import { GroupOverview } from "@/components/ui/group-overview/group-overview";
import { groupBasePath, kindHref } from "@/config/kind-routes";
import { NAV_GROUPS } from "@/config/nav";
import { KindGroup } from "@/config/record-kinds";
import { variantFor } from "@/features/kinds/variant-registry";
import { ModuleForm } from "@/features/overview/components/module-form";
import { useCatalogRecord } from "@/hooks/use-catalog-record";
import { useKindRecords } from "@/hooks/use-kind-records";
import { useKinds } from "@/hooks/use-kinds";
import { Kind } from "@/lib/db/queries/kinds";
import { fragmentHref, fragmentMeta, fragmentTitle, recordItem } from "@/utils/overview-items";

/**
 * 三個 group 共用的通用頁骨架。找到 kind 之後照 slug 決定要不要換皮，
 * 沒有 variant 的就是通用表單／通用列表——這是絕大多數自訂類型會走的路。
 */
function useKindBySlug(group: KindGroup, slug: string): { kind?: Kind; isLoading: boolean } {
  const { kinds, isLoading } = useKinds();
  return { kind: kinds.find((k) => k.group === group && k.slug === slug), isLoading };
}

/**
 * 沒有 variant 的類型就用這個畫清單——絕大多數自訂類型走這條。
 *
 * 紀錄那堆照月份排成封面格線，跟內建類型同一套；片段與專欄一則一張卡。
 * 空的時候要說話：側欄把 0 筆的類型也列出來，點進來一片空白等於沒有下一步。
 */
function GenericKindList({ kind }: { kind: Kind }) {
  const { records, fragments, isLoading, error } = useKindRecords(kind.id);

  if (error) return <PageMessage tone="error">{error}</PageMessage>;
  if (isLoading) return <PageLoading />;

  const isRecords = kind.group === "records";
  const empty = isRecords ? records.length === 0 : fragments.length === 0;
  if (empty) {
    return (
      <PageMessage fill>
        還沒有任何{kind.name}。
        <Link href={`${kindHref(kind.group, kind.slug)}/new`} className="underline">
          記下第一筆
        </Link>
      </PageMessage>
    );
  }

  if (isRecords) {
    return (
      <GroupOverview
        active={[]}
        pending={[]}
        done={records.map(recordItem)}
        headlineLabel=""
        unit={kind.amountUnit || "筆"}
      />
    );
  }

  return (
    <CardMasonry>
      {fragments.map((row) => (
        <FragmentCard
          key={row.id}
          href={fragmentHref(row)}
          title={fragmentTitle(row)}
          label={row.kindName}
          body={row.body}
          meta={fragmentMeta(row)}
          coverUrl={row.coverUrl}
        />
      ))}
    </CardMasonry>
  );
}

export function KindListPage({ group, slug }: { group: KindGroup; slug: string }) {
  const { kind, isLoading } = useKindBySlug(group, slug);
  const List = kind ? variantFor(kind.slug).list : undefined;

  return (
    <>
      <PageHeader
        title={kind?.name ?? ""}
        action={
          kind && (
            <ActionButton
              href={`${kindHref(group, slug)}/new`}
              label={`新增${kind.name}`}
              text="新增"
            >
              <Plus size={16} strokeWidth={2} aria-hidden />
            </ActionButton>
          )
        }
      />
      <PageBody>
        {isLoading ? (
          <PageLoading />
        ) : !kind ? (
          <PageMessage>找不到這個類型</PageMessage>
        ) : List ? (
          <List kind={kind} />
        ) : (
          <GenericKindList kind={kind} />
        )}
      </PageBody>
    </>
  );
}

export function KindNewPage({ group, slug }: { group: KindGroup; slug: string }) {
  const { kind, isLoading } = useKindBySlug(group, slug);
  const Form = kind ? variantFor(kind.slug).form : undefined;
  const groupLabel = NAV_GROUPS.find((g) => g.kindGroup === group)?.label;

  return (
    <>
      <PageHeader
        title={kind ? `新增${kind.name}` : ""}
        size="compact"
        parent={
          kind && [
            { label: groupLabel ?? "", href: groupBasePath(group) },
            { label: kind.name, href: kindHref(group, slug) },
          ]
        }
        backHref={kindHref(group, slug)}
      />
      <PageBody>
        {isLoading || !kind ? (
          <PageLoading />
        ) : Form ? (
          <Form kind={kind} />
        ) : (
          <ModuleForm kind={kind} />
        )}
      </PageBody>
    </>
  );
}

export function KindRecordPage({
  group,
  slug,
  recordId,
}: {
  group: KindGroup;
  slug: string;
  recordId: string;
}) {
  const { kind, isLoading: kindLoading } = useKindBySlug(group, slug);
  const { record, isLoading: recordLoading, error } = useCatalogRecord(recordId);
  const Detail = kind ? variantFor(kind.slug).detail : undefined;
  const Form = kind ? variantFor(kind.slug).form : undefined;
  const isLoading = kindLoading || recordLoading;
  const groupLabel = NAV_GROUPS.find((g) => g.kindGroup === group)?.label;

  return (
    <>
      <PageHeader
        title={record?.values.title ?? ""}
        size="compact"
        parent={
          kind && [
            { label: groupLabel ?? "", href: groupBasePath(group) },
            { label: kind.name, href: kindHref(group, slug) },
          ]
        }
        backHref={kindHref(group, slug)}
      />
      <PageBody>
        {error ? (
          <PageMessage tone="error">{error}</PageMessage>
        ) : isLoading || !kind || !record ? (
          <PageLoading />
        ) : Detail ? (
          <Detail kind={kind} recordId={recordId} />
        ) : Form ? (
          <Form kind={kind} recordId={recordId} initial={record.values} />
        ) : (
          <ModuleForm kind={kind} recordId={recordId} initial={record.values} />
        )}
      </PageBody>
    </>
  );
}
