import Link from "next/link";
import { BookCover } from "@/components/ui/book-cover";
import { Quote } from "@/components/ui/quote";
import { CardData } from "@/utils/card-data";

/**
 * 佳句的一列。一句一列，不切兩欄——長句被擠成一行三四個字就讀不下去了。
 *
 * 左邊一張書封講出處，右邊是句子本身。一句怎麼畫交給 Quote，這裡只管
 * 擺封面與點進去；排成一落由外層決定。
 */

const styles = {
  // 封面與句子並排；min-w-0 讓長句縮得下去，不然會把封面擠掉
  row: "border-rule flex items-start gap-3 border-b py-4 last:border-b-0 first:pt-0 hover:bg-gray-50",
  body: "flex min-w-0 flex-1 flex-col gap-1.5",
};

export function QuoteRow({ data }: { data: CardData }) {
  return (
    <Link href={data.href} className={styles.row}>
      {/* 沒封面不畫灰塊，句子靠左 */}
      {data.coverUrl && <BookCover url={data.coverUrl} title={data.coverTitle} size="md" />}
      <div className={styles.body}>
        {/* 句子本身在 title，body 是補充（翻譯、心得）——反過來的話
            日文佳句會秀成中文翻譯，原句反而不見 */}
        <Quote text={data.title} source={data.meta} />
      </div>
    </Link>
  );
}
