import { fetchBookMetadata, PROVIDER_BY_SLUG } from "@/lib/metadata";
import { bookToFields } from "@/utils/scraped-values";

export type BookSlug = keyof typeof PROVIDER_BY_SLUG;

/** 用書名問指定的一家書店或圖書館。來源壞掉要說出來，不能當成「查不到」 */
export async function lookupBook(
  slug: BookSlug,
  title: string,
  language?: string,
): Promise<Record<string, string> | null> {
  const { metadata, unavailable } = await fetchBookMetadata(title, undefined, { language }, [
    PROVIDER_BY_SLUG[slug],
  ]);
  if (metadata) return bookToFields(metadata);
  if (unavailable.length) throw new Error(`來源暫時不能用：${unavailable.join("、")}`);
  return null;
}
