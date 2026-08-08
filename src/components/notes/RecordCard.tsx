"use client";

const styles = {
  card: "flex cursor-pointer items-start gap-3 rounded-lg border bg-white p-4 hover:border-gray-400",
  side: "flex w-14 shrink-0 flex-col gap-1.5",
  cover: "aspect-2/3 w-full rounded-sm object-cover shadow ring-1 ring-black/10",
  blank:
    "flex aspect-2/3 w-full items-center justify-center rounded-sm bg-gray-100 text-[10px] leading-tight text-gray-400",
  title: "text-[11px] leading-snug text-gray-500",
  body: "flex min-w-0 flex-1 flex-col gap-2",
};

type RecordCardProps = {
  title: string;
  coverUrl: string;
  onClick: () => void;
  children: React.ReactNode;
};

/** 佳句與心得共用的版式：左邊封面與書名，右邊內文 */
export function RecordCard({ title, coverUrl, onClick, children }: RecordCardProps) {
  return (
    <div onClick={onClick} className={styles.card}>
      <div className={styles.side}>
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" loading="lazy" className={styles.cover} />
        ) : (
          <div className={styles.blank}>{title.slice(0, 2)}</div>
        )}
        <p className={styles.title}>{title}</p>
      </div>

      <div className={styles.body}>{children}</div>
    </div>
  );
}
