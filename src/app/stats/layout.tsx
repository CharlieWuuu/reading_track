import { PageBody } from "@/components/layout/page-body";
import { PageHeader } from "@/components/layout/page-header";

/**
 * 統計的外框。頁首沒有選單了：類型走側欄與 NavKindStrip，
 * 各類型的統計是那一頁的一種檢視（?view=stats），不在這裡切。
 *
 * 這一層剩下的是不屬於任何類型的東西——卡片牆首頁與全站月曆。
 */
export default function StatsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PageHeader title="統計" />
      <PageBody>{children}</PageBody>
    </>
  );
}
