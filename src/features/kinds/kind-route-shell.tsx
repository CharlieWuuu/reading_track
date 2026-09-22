"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";
import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { ActionButton } from "@/components/ui/controls/action-button";
import { GroupOverview } from "@/components/ui/group-overview/group-overview";
import { KindCards } from "@/components/ui/kind-cards/kind-cards";
import { groupBasePath, kindHref } from "@/config/kind-routes";
import { NAV_GROUPS, unitOfKind } from "@/config/nav";
import { KindGroup } from "@/config/record-kinds";
import { KindCalendar } from "@/features/calendar/components/kind-calendar";
import { KindTimeline } from "@/features/calendar/components/kind-timeline";
import { KindViewMenu } from "@/features/kinds/kind-view-menu";
import { variantFor } from "@/features/kinds/variant-registry";
import { FormTabSwitch } from "@/features/overview/components/form-tab-switch";
import { ModuleDetail } from "@/features/overview/components/module-detail";
import { ModuleForm } from "@/features/overview/components/module-form";
import { KindStats } from "@/features/stats/components/kind-stats";
import {
  fragmentThreadRow,
  WRITING_THREAD_GRID,
  WritingThreadRow,
} from "@/features/writing/components/writing-thread-row";
import { useBookView } from "@/hooks/use-book-view";
import { useCatalogRecord } from "@/hooks/use-catalog-record";
import { useKindRecords } from "@/hooks/use-kind-records";
import { useKinds } from "@/hooks/use-kinds";
import { useRecordId } from "@/hooks/use-record-id";
import { Kind } from "@/lib/db/queries/kinds";
import { fragmentItem, recordItem } from "@/utils/overview-items";

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
    const byId = new Map(fragments.map((row) => [row.id, row]));
    return (
      <GroupOverview
        active={[]}
        pending={[]}
        done={isRecords ? records.map(recordItem) : fragments.map(fragmentItem)}
        headlineLabel="" // 書寫不要頭條；紀錄本來就沒有
        unit={unitOfKind(kind)} // amountUnit 是份量（頁、分鐘），這裡要的是個數
        // 書寫一路往下讀，不是卡片牆；紀錄仍然是封面格線
        renderItem={
          isRecords
            ? undefined
            : (item) => {
                const row = byId.get(item.id);
                return row ? <WritingThreadRow {...fragmentThreadRow(row)} /> : null;
              }
        }
        gridClassName={isRecords ? undefined : WRITING_THREAD_GRID}
        railDesktopOnly={!isRecords} // 書寫的統計手機版不顯示；紀錄照舊
      />
    );
  }

  // 畫法由類型自己帶：佳句是句子不是卡片，切成兩欄會把長句擠成一行三四個字
  return <KindCards style={kind.cardStyle} rows={fragments} />;
}

type KindRouteProps = {
  group: KindGroup;
  slug: string;
};

export function KindListPage({ group, slug }: KindRouteProps) {
  const { kind, isLoading } = useKindBySlug(group, slug);
  // 麵包屑指回這個 group 的概覽，字跟側欄同一份設定
  const parent = NAV_GROUPS.find((nav) => nav.kindGroup === group);
  const view = useBookView();

  return (
    <>
      <PageHeader
        title={kind?.name ?? ""}
        parent={parent ? [{ label: parent.label, href: parent.href }] : undefined}
        action={
          kind && (
            <div className="flex min-w-0 items-center gap-2">
              {/* 自訂類型也要有統計：清單與統計是同一批資料的兩種看法。
                  概覽與表格是紀錄那一套的排法，通用清單還沒有，所以只給這兩項 */}
              <KindViewMenu />
              <ActionButton href={`${kindHref(kind.group, kind.slug)}/new`} text="新增">
                <Plus size={16} strokeWidth={2} aria-hidden />
              </ActionButton>
            </div>
          )
        }
      />
      <PageBody>
        {isLoading ? (
          <PageLoading />
        ) : !kind ? (
          <PageMessage>找不到這個類型</PageMessage>
        ) : view === "stats" ? (
          <KindStats
            kind={kind}
            // 月曆與數線住在 features/calendar，統計那邊 import 不到；
            // kinds 不在 eslint 的 feature 區裡，兩邊的交會點就落在這裡
            wide={{
              calendar: <KindCalendar kind={kind} />,
              timeline: <KindTimeline kind={kind} />,
            }}
          />
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
        // 專用表單沒有分內容／屬性，那顆不畫
        action={kind && !Form ? <FormTabSwitch /> : undefined}
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
        {error ? (
          <PageMessage tone="error">{error}</PageMessage>
        ) : isLoading || !kind || !record ? (
          <PageLoading />
        ) : Form ? (
          <Form kind={kind} recordId={id} initial={record.values} />
        ) : (
          <ModuleForm kind={kind} recordId={id} linkId={record.linkId} initial={record.values} />
        )}
      </PageBody>
    </>
  );
}
