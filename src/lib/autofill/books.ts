import { fetchBookMetadata } from "@/lib/metadata";
import { bookToFields } from "@/utils/scraped-values";

/** 書名查各家書籍資料庫。來源壞掉要說出來，不能當成「查不到」 */
export async function lookupBooks(
  title: string,
  language?: string,
): Promise<Record<string, string> | null> {
  const { metadata, unavailable } = await fetchBookMetadata(title, undefined, { language });
  if (metadata) return bookToFields(metadata);
  if (unavailable.length) throw new Error(`來源暫時不能用：${unavailable.join("、")}`);
  return null;
}
