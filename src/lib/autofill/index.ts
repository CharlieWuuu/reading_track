import { AutofillSlug } from "@/config/autofill-sources";
import { lookupBooks } from "./books";
import { lookupWikipedia } from "./wikipedia";

export type AutofillQuery = { title: string; language?: string };

type Found = Record<string, string> | null;

/** 少一個 slug 編譯就不過：config 加了來源，這裡一定要有實作 */
const RUNNERS: Record<AutofillSlug, (query: AutofillQuery) => Promise<Found>> = {
  books: ({ title, language }) => lookupBooks(title, language),
  wikipedia: ({ title }) => lookupWikipedia(title),
};

/** 依勾選順序問，第一個查到的為止。來源丟錯就跳過，全部都沒結果才把最後的錯丟出去 */
export async function runSources(
  sources: readonly AutofillSlug[],
  query: AutofillQuery,
): Promise<{ source: AutofillSlug; fields: Record<string, string> } | null> {
  let failure: unknown = null;
  for (const source of sources) {
    try {
      const fields = await RUNNERS[source](query);
      if (fields) return { source, fields };
    } catch (err) {
      failure = err;
    }
  }
  if (failure) throw failure;
  return null;
}
