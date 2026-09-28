"use client";

import { PageAside, PageBody, PageMain } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { ActionButton } from "@/components/ui/controls/action-button";
import { KindGroup } from "@/config/kind-groups";
import { groupBasePath, kindHref } from "@/config/kind-routes";
import { NAV_GROUPS } from "@/config/nav";
import { variantFor } from "@/features/kinds/variant-registry";
import { FormTabNav, FormTabSwitch } from "@/features/overview/components/form-tab-switch";
import { ModuleDetail } from "@/features/overview/components/module-detail";
import { ModuleForm } from "@/features/overview/components/module-form";
import { useCatalogRecord } from "@/hooks/use-catalog-record";
import { useKinds } from "@/hooks/use-kinds";
import { useRecordId } from "@/hooks/use-record-id";
import { Kind } from "@/lib/db/queries/kinds";

/**
 * 三個 group 共用的通用頁骨架。找到 kind 之後照 slug 決定要不要換皮，
 * 沒有 variant 的就是通用表單／通用列表——這是絕大多數自訂類型會走的路。
 */
function useKindBySlug(group: KindGroup, slug: string): { kind?: Kind; isLoading: boolean } {
  const { kinds, isLoading } = useKinds();
  return { kind: kinds.find((k) => k.group === group && k.slug === slug), isLoading };
}

type KindRouteProps = {
  group: KindGroup;
  slug: string;
};

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
        // 專用表單沒有分內容／屬性，那顆不畫；桌機在右欄
        action={kind && !Form ? <FormTabSwitch /> : undefined}
      />
      <PageBody>
        <PageMain>
          {isLoading || !kind ? (
            <PageLoading />
          ) : Form ? (
            <Form kind={kind} />
          ) : (
            <ModuleForm kind={kind} />
          )}
        </PageMain>
        {kind && !Form && (
          <PageAside>
            <FormTabNav />
          </PageAside>
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
  // 網址那一段可能是編號，也可能是名字（關鍵字的連結一直用詞）——都接得住
  const { id, isLoading: idLoading } = useRecordId(kind?.id ?? "", recordId);
  const { record, isLoading: recordLoading, error } = useCatalogRecord(id);
  const isLoading = kindLoading || idLoading || recordLoading;

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
            <ActionButton href={`${kindHref(group, slug)}/${id || recordId}/edit`}>
              編輯
            </ActionButton>
          )
        }
      />
      <PageBody>
        {error ? (
          <PageMain>
            <PageMessage tone="error">{error}</PageMessage>
          </PageMain>
        ) : isLoading || !kind || !record ? (
          <PageMain>
            <PageLoading />
          </PageMain>
        ) : (
          <ModuleDetail kind={kind} values={record.values} /> // 自己給中間與右欄
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
  // 跟詳情頁同一套：網址那一段可能是編號也可能是名字
  const { id, isLoading: idLoading } = useRecordId(kind?.id ?? "", recordId);
  const { record, isLoading: recordLoading, error } = useCatalogRecord(id);
  const Form = kind ? variantFor(kind.slug).form : undefined;
  const isLoading = kindLoading || idLoading || recordLoading;
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
        action={kind && !Form ? <FormTabSwitch /> : undefined}
      />
      <PageBody>
        <PageMain>
          {error ? (
            <PageMessage tone="error">{error}</PageMessage>
          ) : isLoading || !kind || !record ? (
            <PageLoading />
          ) : Form ? (
            <Form kind={kind} recordId={id} initial={record.values} />
          ) : (
            <ModuleForm kind={kind} recordId={id} linkId={record.linkId} initial={record.values} />
          )}
        </PageMain>
        {kind && !Form && (
          <PageAside>
            <FormTabNav />
          </PageAside>
        )}
      </PageBody>
    </>
  );
}
