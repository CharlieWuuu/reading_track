import { Ref } from "react";

// PageBody 底下只放 PageMain、PageAside，兩欄各自捲；載入中與訊息也包進 PageMain

const styles = {
  frame:
    "grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_1px_14.5rem]", // 右欄那格一律留，每頁中間一樣寬；窄螢幕只剩中間
  rule: "bg-rule-strong col-start-2 row-start-1 hidden lg:block", // 分隔線由外框畫，右欄空著也有
  main: "col-start-1 row-start-1 flex min-w-0 flex-col overflow-y-auto pb-10",
  aside: "col-start-3 row-start-1 hidden flex-col gap-8 overflow-y-auto pb-10 lg:flex",
};

type SlotProps = { children: React.ReactNode };

export function PageBody({ children }: SlotProps) {
  return (
    <div className={styles.frame}>
      {children}
      <div className={styles.rule} />
    </div>
  );
}

export function PageMain({ children, ref }: SlotProps & { ref?: Ref<HTMLDivElement> }) {
  return (
    <div className={styles.main} ref={ref}>
      {children}
    </div>
  );
}

export function PageAside({ children }: SlotProps) {
  return <aside className={styles.aside}>{children}</aside>;
}
