/**
 * 詳細頁的排版零件。書籍那一頁先長出來，其餘四種（文章、紀事、佳句、單字）
 * 一樣是「一份文件」而不是「十張小卡」，所以共用同一套。
 */

/**
 * 章節標題列。照設計稿：全大寫小標的字級與字距，配一條實線，右邊放數量。
 *
 * 小標自己不搶戲——它比內文小得多，靠字距與那條線撐出段落感。
 * 書籍詳情那一頁的欄位不成段（基本資料、佳句預覽各自排版），只要這一列。
 */
export function DetailHeading({ title, count }: { title: string; count?: string | number }) {
  return (
    <div className="border-rule-strong flex items-baseline justify-between border-b pb-1.5">
      <h3 className="text-label text-ink tracking-label font-semibold uppercase">{title}</h3>
      {count !== undefined && (
        <span className="text-meta text-ink-faint tabular-nums">{count}</span>
      )}
    </div>
  );
}

/** 一段：標題列加底下的內容 */
export function DetailSection({
  title,
  count,
  children,
}: {
  title: string;
  /** 這一段有幾筆。給字串是為了讓呼叫端自己接量詞（「11 則」「3 個」） */
  count?: string | number;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <DetailHeading title={title} count={count} />
      {children}
    </section>
  );
}

/**
 * 資訊表的一列：欄位名稱在左，值在右，中間靠固定欄寬對齊成一直排。
 * 欄名最長三個字，欄寬照三個字給，剩下的寬度留給值。
 *
 * 沒有值就整列不畫——一排「—」只是在告訴人「這裡什麼都沒有」，佔的卻是
 * 跟有內容的欄位一樣的高度。
 */
export function DetailField({
  label,
  children,
  align = "left",
}: {
  label: string;
  children: React.ReactNode;
  /** 值靠右對齊——窄的資料卡（如書籍詳情右欄）齊尾比較好讀 */
  align?: "left" | "right";
}) {
  if (!children) return null;
  return (
    <div className="grid grid-cols-[3.25rem_minmax(0,1fr)] items-baseline gap-2 py-1.5">
      <span className="text-xs text-gray-400">{label}</span>
      <div className={`min-w-0 text-sm text-gray-800 ${align === "right" ? "text-right" : ""}`}>
        {children}
      </div>
    </div>
  );
}

/**
 * 短欄位排成兩欄的資訊表，每列之間一條淺色分隔線，讀起來像一份目錄。
 *
 * 手機摺成一欄時兩組會上下接起來，接縫那一條要自己補——分隔線畫在各組內部，
 * 組跟組之間本來就沒有。桌機是並排的兩欄，補了反而多一條橫線。
 */
export function DetailFields({ children }: { children: React.ReactNode }) {
  return (
    <div className="divide-rule-soft [&>div]:divide-rule-soft grid grid-cols-1 gap-x-10 divide-y sm:grid-cols-2 sm:divide-y-0 [&>div]:divide-y">
      {children}
    </div>
  );
}

/**
 * 詳情頁的頭：左邊主角（封面、標題、副標、統計），右邊一張固定資料卡。
 *
 * 書籍那一頁先長出來的版式，其餘詳情頁共用——每一頁的欄位不同，但「主角在左、
 * 屬性靠右」是同一件事。facts 沒給就不畫右欄，整條線也跟著收掉。
 */
export function DetailHeader({
  children,
  facts,
}: {
  children: React.ReactNode;
  /** 右邊那張資料卡的內容，通常是一串 align="right" 的 DetailField */
  facts?: React.ReactNode;
}) {
  return (
    <header className="border-rule-strong flex flex-col gap-6 border-b pb-6 md:flex-row">
      <div className="flex gap-4 sm:flex-1 md:gap-10">{children}</div>
      {facts && (
        <div className="w-full shrink-0 md:w-52 md:border-l md:pl-6">
          <DetailHeading title="基本資料" />
          {facts}
        </div>
      )}
    </header>
  );
}

/** 詳情頁的大標題。主角是誰就放誰——書名、文章標題、那個詞 */
export function DetailTitle({ title, subtitle }: { title: string; subtitle?: React.ReactNode }) {
  return (
    <>
      <h2 className="font-serif text-2xl leading-tight font-semibold break-words text-gray-900 md:text-3xl">
        {title}
      </h2>
      {subtitle && <p className="font-serif text-base text-gray-500">{subtitle}</p>}
    </>
  );
}
