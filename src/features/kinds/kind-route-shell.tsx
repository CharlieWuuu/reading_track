"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { CardGrid } from "@/components/ui/card-grid";
import { ActionButton } from "@/components/ui/controls/action-button";
import { FragmentCard } from "@/components/ui/fragment-card/fragment-card";
import { GroupOverview } from "@/components/ui/group-overview/group-overview";
import { QuoteWall } from "@/components/ui/quote-wall";
import { groupBasePath, kindHref } from "@/config/kind-routes";
import { NAV_GROUPS, unitOfKind } from "@/config/nav";
import { KindGroup } from "@/config/record-kinds";
import { variantFor } from "@/features/kinds/variant-registry";
import { ModuleDetail } from "@/features/overview/components/module-detail";
import { ModuleForm } from "@/features/overview/components/module-form";
import { useCatalogRecord } from "@/hooks/use-catalog-record";
import { useKindRecords } from "@/hooks/use-kind-records";
import { useKinds } from "@/hooks/use-kinds";
import { Kind } from "@/lib/db/queries/kinds";
import { fragmentCard, fragmentHref, fragmentItem, recordItem } from "@/utils/overview-items";

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
 * 紀錄那個 group 照月份排成封面格線，跟內建類型同一套；片段與書寫一則一張卡。
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

  // 書寫跟紀錄一樣照月份排：一篇心得是一件完成的事，有日期、值得回頭找
  if (isRecords || kind.group === "writings") {
    return (
      <GroupOverview
        active={[]}
        pending={[]}
        done={isRecords ? records.map(recordItem) : fragments.map(fragmentItem)}
        headlineLabel={isRecords ? "" : "最新一則"}
        unit={unitOfKind(kind)} // amountUnit 是份量（頁、分鐘），這裡要的是個數
      />
    );
  }

  // 佳句是句子不是卡片：切成兩欄會把長句擠成一行三四個字
  if (kind.slug === "quotes") return <QuoteWall rows={fragments} hrefOf={fragmentHref} />;

  return (
    <CardGrid>
      {fragments.map((row) => (
        <FragmentCard key={row.id} {...fragmentCard(row)} />
      ))}
    </CardGrid>
  );
}

type KindRouteProps = {
  group: KindGroup;
  slug: string;
};

export function KindListPage({ group, slug }: KindRouteProps) {
  const { kind, isLoading } = useKindBySlug(group, slug);
  // 麵包屑指回這個 group 的概覽，字跟側欄同一份設定
  const parent = NAV_GROUPS.find((nav) => nav.kindGroup === group);

  return (
    <>
      <PageHeader
        title={kind?.name ?? ""}
        parent={parent ? [{ label: parent.label, href: parent.href }] : undefined}
        action={
          kind && (
            <ActionButton href={`${kindHref(kind.group, kind.slug)}/new`} text="新增">
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
        ) : (
          <GenericKindList kind={kind} />
        )}
      </PageBody>
    </>
  );
}

export function KindNewPage({ group, slug }: KindRouteProps) {
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

type RecordRouteProps = KindRouteProps & {
  recordId: string;
};

export function KindRecordPage({ group, slug, recordId }: RecordRouteProps) {
  const { kind, isLoading: kindLoading } = useKindBySlug(group, slug);
  // 認網址上那一段，不認 kind.slug——書寫那條路（/writings/writing）在
  // setting_kinds 裡沒有對應的類型，等 kind 會永遠等不到
  const Detail = variantFor(slug).detail;
  const groupLabel = NAV_GROUPS.find((g) => g.kindGroup === group)?.label;

  // 有專屬詳情的類型自己撈資料、自己畫頁首——它們的 recordId 不一定是編號
  // （單字與關鍵字是詞本身），拿去查 catalog 永遠查不到，會卡在載入中
  if (Detail) return <Detail recordId={recordId} />;

  return <GenericRecordPage {...{ group, slug, recordId, kind, kindLoading, groupLabel }} />;
}

/** 沒有專屬詳情的類型：照模組畫，頁首與外框由這裡給 */
type GenericPageProps = RecordRouteProps & {
  kind?: Kind;
  kindLoading: boolean;
  groupLabel?: string;
};

function GenericRecordPage({
  group,
  slug,
  recordId,
  kind,
  kindLoading,
  groupLabel,
}: GenericPageProps) {
  const { record, isLoading: recordLoading, error } = useCatalogRecord(recordId);
  const isLoading = kindLoading || recordLoading;

  return (
    <>
      {/* 標題不放頁首：一則紀錄的標題可以很長，擠在麵包屑那一行會被動作按鈕蓋掉。
          跟書籍詳情同一套——頁首只說「詳情」，標題在內容區當大標 */}
      <PageHeader
        title="詳情"
        size="compact"
        parent={
          kind && [
            { label: groupLabel ?? "", href: groupBasePath(group) },
            { label: kind.name, href: kindHref(group, slug) },
          ]
        }
        backHref={kindHref(group, slug)}
        action={
          kind && (
            <ActionButton href={`${kindHref(group, slug)}/${recordId}/edit`}>編輯</ActionButton>
          )
        }
      />
      <PageBody>
        {error ? (
          <PageMessage tone="error">{error}</PageMessage>
        ) : isLoading || !kind || !record ? (
          <PageLoading />
        ) : (
          <ModuleDetail kind={kind} values={record.values} />
        )}
      </PageBody>
    </>
  );
}

/**
 * 一筆紀錄的編輯頁。詳情頁按了「編輯」才會到這裡——看跟改是兩件事，
 * 點進一筆不該直接掉進表單。
 */
export function KindEditPage({ group, slug, recordId }: RecordRouteProps) {
  // 跟詳情頁同一個道理：有專屬編輯頁的類型自己撈自己畫。單字與關鍵字的
  // recordId 是「詞」不是編號，底下那支 useCatalogRecord 查不到，會卡在載入中
  const Edit = variantFor(slug).edit;
  if (Edit) return <Edit recordId={recordId} />;

  return <GenericEditPage {...{ group, slug, recordId }} />;
}

/** 沒有專屬編輯頁的類型：照模組畫，頁首與外框由這裡給 */
function GenericEditPage({ group, slug, recordId }: RecordRouteProps) {
  const { kind, isLoading: kindLoading } = useKindBySlug(group, slug);
  const { record, isLoading: recordLoading, error } = useCatalogRecord(recordId);
  const Form = kind ? variantFor(kind.slug).form : undefined;
  const isLoading = kindLoading || recordLoading;
  const groupLabel = NAV_GROUPS.find((g) => g.kindGroup === group)?.label;
  const back = `${kindHref(group, slug)}/${recordId}`;

  return (
    <>
      <PageHeader
        title="編輯"
        size="compact"
        parent={
          kind && [
            { label: groupLabel ?? "", href: groupBasePath(group) },
            { label: kind.name, href: kindHref(group, slug) },
            { label: record?.values.title ?? "", href: back },
          ]
        }
        backHref={back}
      />
      <PageBody>
        {error ? (
          <PageMessage tone="error">{error}</PageMessage>
        ) : isLoading || !kind || !record ? (
          <PageLoading />
        ) : Form ? (
          <Form kind={kind} recordId={recordId} initial={record.values} />
        ) : (
          <ModuleForm
            kind={kind}
            recordId={recordId}
            linkId={record.linkId}
            initial={record.values}
          />
        )}
      </PageBody>
    </>
  );
}
