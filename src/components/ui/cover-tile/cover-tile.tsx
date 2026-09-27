import Link from "next/link";
import { BookCover } from "@/components/ui/book-cover";
import { STATUS_DOTS } from "@/components/ui/tag-badge";
import { RecordStatus } from "@/types/book";

/**
 * 卡片檢視的一格：書封牆。一次看到很多本、也看得清楚封面，不加外框讓封面自己說話。
 *
 * 書封、書名、日期三層靠 gap 分開，格子高度固定，不隨書名長短跳動。
 * 本來寫死在書籍專屬頁；卡片檢視只給勾了封面圖的類型，所以任何有封面的類型都長這樣。
 */

/** 小張密排：手機一排約四本，寬螢幕更多 */
export const COVER_TILE_GRID =
  "grid grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] md:grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))]";

const styles = {
  cell: "p-1.5",
  link: "group flex flex-col gap-1",
  title: "text-item-sm truncate font-serif leading-snug font-semibold",
  meta: "text-meta text-ink-faint truncate tabular-nums",
};

/** 封面左上角的狀態點。整面是圖，左側色條會把版面切得很碎，改成一顆點；完成的不標 */
function StatusDot({ status }: { status: RecordStatus }) {
  if (status === "完成") return null;
  return (
    <span
      aria-label={status}
      className={`absolute top-1 left-1 size-2 rounded-full ring-2 ring-white ${STATUS_DOTS[status]}`}
    />
  );
}

export type CoverTileProps = {
  href?: string; // 不給就不可點，設定頁的預覽用
  title: string;
  coverUrl: string;
  /** 完成的寫日期，沒完成的寫狀態 */
  meta: string;
  status?: RecordStatus;
};

export function CoverTile({ href, title, coverUrl, meta, status }: CoverTileProps) {
  const content = (
    <>
      <div className="relative">
        <BookCover
          url={coverUrl}
          title={title}
          size="full"
          className="transition group-hover:shadow-md"
        />
        {status && <StatusDot status={status} />}
      </div>
      <p className={styles.title}>{title}</p>
      <p className={styles.meta}>{meta}</p>
    </>
  );

  return (
    <div className={styles.cell}>
      {href ? (
        <Link href={href} className={styles.link}>
          {content}
        </Link>
      ) : (
        <div className={styles.link}>{content}</div>
      )}
    </div>
  );
}
