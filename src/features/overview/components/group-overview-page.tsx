"use client";

import { PageAside, PageMain } from "@/components/layout/page-body";
import { PageLoading } from "@/components/layout/page-loading";
import { PageMessage } from "@/components/layout/page-message";
import { DomainFilter } from "@/components/ui/domain-filter/domain-filter";
import { GroupOverview } from "@/components/ui/group-overview/group-overview";
import { styledGrid } from "@/components/ui/kind-cards/kind-cards";
import { KindSectionBlock } from "@/components/ui/kind-section/kind-section";
import { OverviewHeadline } from "@/components/ui/overview-layout/overview-headline";
import { OverviewTotalStats } from "@/components/ui/overview-layout/overview-rail-stats";
import { KindGroup } from "@/config/kind-groups";
import { unitOfGroup } from "@/config/nav";
import { useDomainParam } from "@/hooks/use-domain-param";
import { useGroupFragments } from "@/hooks/use-group-fragments";
import { useGroupRecordsOverview } from "@/hooks/use-group-records-overview";
import { useKinds } from "@/hooks/use-kinds";
import { useMounted } from "@/hooks/use-mounted";
import { styledFragment, styledRecord } from "@/utils/card-data";
import { domainsOf, inDomain } from "@/utils/domain-filter";
import { moduleKeysByKind, splitByStatus } from "@/utils/kind-list";
import { fragmentItem, recordItem } from "@/utils/overview-items";
import { sectionsByKind } from "@/utils/overview-sections";

/** 錯誤與載入中先擋下來，兩個 group 同一套；擋掉就回那一塊畫面，沒事回 null */
function gate({ error, isLoading }: { error?: string; isLoading: boolean }) {
  if (error)
    return (
      <PageMain>
        <PageMessage tone="error">{error}</PageMessage>
      </PageMain>
    );
  if (isLoading)
    return (
      <PageMain>
        <PageLoading />
      </PageMain>
    );
  return null;
}

const styles = {
  empty: "text-meta text-ink-faint py-8 text-center",
  sections: "flex flex-col gap-6",
};

type GroupOverviewPageProps = {
  group: KindGroup;
};

/**
 * 三個 group 的概覽。紀錄讀 records 那支 hook，片段與書寫讀 fragments 那支。
 *
 * hook 一律無條件呼叫，只是畫面依 group 決定用哪一份——不能因為分支才決定要不要呼叫。
 */
export function GroupOverviewPage({ group }: GroupOverviewPageProps) {
  const isRecords = group === "records";
  const { domain, toggle } = useDomainParam();
  const recordsOverview = useGroupRecordsOverview("records", domain); // 完成的那批在伺服器端篩
  const fragmentsData = useGroupFragments(group);
  const mounted = useMounted();
  const { kinds } = useKinds();

  if (!mounted) return null; // 靜態那份 HTML 一定是空的，先判斷資料狀態會閃一下「空的」

  if (isRecords) {
    const blocked = gate(recordsOverview);
    if (blocked) return blocked;

    // 沒完成的那批照各自類型勾的日期再分：沒勾開始日期的不算在讀，兩個日期都沒勾的算完成
    const activeRows = recordsOverview.active.filter(inDomain(domain));
    const { active, pending, done } = splitByStatus(activeRows, moduleKeysByKind(kinds));

    return (
      <GroupOverview
        active={active.map(recordItem)}
        pending={pending.map(recordItem)}
        done={[...done, ...recordsOverview.done].map(recordItem)}
        doneTotal={recordsOverview.doneTotal}
        headlineLabel="在讀 · 最近開始的一本"
        doneHeadlineLabel="最近完成的一筆"
        unit="筆"
        // 右欄的進行、想要也照樣式畫，所以 active 也要進去
        {...styledGrid([...activeRows, ...recordsOverview.done].map(styledRecord))}
        filter={<DomainFilter domains={recordsOverview.domains} value={domain} onToggle={toggle} />}
        onLoadMore={recordsOverview.loadMore}
        hasMore={recordsOverview.hasMore}
        isLoadingMore={recordsOverview.isLoadingMore}
      />
    );
  }

  const blocked = gate(fragmentsData);
  if (blocked) return blocked;
  if (fragmentsData.fragments.length === 0)
    return (
      <PageMain>
        <div className={styles.empty}>還沒有任何紀錄</div>
      </PageMain>
    );

  const fragments = fragmentsData.fragments.filter(inDomain(domain));
  const filter = (
    <DomainFilter domains={domainsOf(fragmentsData.fragments)} value={domain} onToggle={toggle} />
  );

  // 書寫照月份排，跟底下的書寫子頁一致；沒有進行中，全部當成完成的排。一格照各自類型的樣式
  if (group === "writings") {
    return (
      <GroupOverview
        active={[]}
        pending={[]}
        done={fragments.map(fragmentItem)}
        headlineLabel="" // 不要頭條：一路往下讀的流，頭條會把最新那則講兩次
        unit="則"
        {...styledGrid(fragments.map(styledFragment))}
        filter={filter}
        railDesktopOnly
      />
    );
  }

  // 頭條是「這一頁在講什麼」，底下分區是「有哪些」，兩件事，所以頭條那則照樣列在分區裡
  const [headline] = fragments;

  return (
    <>
      <PageMain>
        <div className={styles.sections}>
          {headline && (
            <OverviewHeadline
              item={fragmentItem(headline)}
              label="最新一則"
              summary={headline.body || undefined}
            />
          )}
          {sectionsByKind(fragments).map((section) => (
            <KindSectionBlock key={section.slug} group={group} section={section} />
          ))}
        </div>
      </PageMain>
      <PageAside>
        <OverviewTotalStats count={fragments.length} unit={unitOfGroup(group)} />
        {filter}
      </PageAside>
    </>
  );
}
