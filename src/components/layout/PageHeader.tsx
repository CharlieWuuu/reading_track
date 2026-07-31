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
      <h2 className="whitespace-nowrap text-base font-semibold">{title}</h2>
      <div className="flex items-center gap-2">
        {action}
        <div className="flex items-center gap-2 md:hidden">
          <RefreshButton compact />
          <AuthButton compact />
        </div>
      </div>
    </div>
  );
}
