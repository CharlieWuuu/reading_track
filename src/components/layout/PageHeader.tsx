import { AuthButton } from "@/components/auth/AuthButton";
import { RefreshButton } from "./RefreshButton";

/**
 * 手機上不再另外做一條品牌列——app 的名稱由系統的標題列負責，
 * 重新整理與帳號直接併進這一排，省下的高度留給內容。
 */
export function PageHeader({
  title,
  action,
}: {
  title: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-gray-900 pb-3 md:mb-5 md:gap-3">
      {/* 手機不顯示標題：底部導覽已經標出在哪一頁，把寬度讓給操作區 */}
      <h2 className="hidden whitespace-nowrap text-base font-semibold md:block">{title}</h2>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
        <div className="min-w-0">{action}</div>
        <div className="flex shrink-0 items-center gap-2 md:hidden">
          <RefreshButton compact />
          <AuthButton compact />
        </div>
      </div>
    </div>
  );
}
