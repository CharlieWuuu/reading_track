"use client";

import { useSession } from "next-auth/react";
import { AuthButton } from "@/components/auth/AuthButton";

const styles = {
  bar: "flex shrink-0 flex-wrap items-center justify-between gap-2 md:gap-3",
  hideBar: "hidden md:flex",
  hideLine: "hidden md:block",
  title: "hidden whitespace-nowrap text-base font-semibold md:block", // 手機靠底部導覽辨識頁面
  actions: "flex min-w-0 flex-1 items-center justify-end gap-2",
  auth: "flex shrink-0 items-center gap-2 md:hidden",
  line: "h-px shrink-0 bg-gray-900",
};

type PageHeaderProps = {
  title: string;
  action?: React.ReactNode; // 頁首右側的操作區
};

/** 頁首與它下面那條線，上下間距都由 main 的 gap 決定 */
export function PageHeader({ title, action }: PageHeaderProps) {
  const { data: session, status } = useSession();
  const showAuth = status !== "loading" && !session?.user; // 登入後入口在設定頁，未登入時手機只剩這裡

  // 桌機永遠有標題，所以只有手機會整條變空；顯示與否交給 CSS，用 JS 判斷會閃
  const emptyOnMobile = !action && !showAuth;
  const hideBar = emptyOnMobile ? styles.hideBar : "";
  const hideLine = emptyOnMobile ? styles.hideLine : "";

  return (
    <>
      <div className={`${styles.bar} ${hideBar}`}>
        {/* 手機不顯示標題，寬度讓給操作區 */}
        <h2 className={styles.title}>{title}</h2>

        <div className={styles.actions}>
          <div className="min-w-0">{action}</div>

          {/* 重新整理改用下拉手勢、帳號在設定頁；未登入時例外，不然手機沒有入口 */}
          {showAuth && (
            <div className={styles.auth}>
              <AuthButton compact />
            </div>
          )}
        </div>
      </div>

      <div className={`${styles.line} ${hideLine}`} />
    </>
  );
}
