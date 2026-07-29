import { Book } from "@/types/book";
import { titleSimilarity } from "./http";
import { googleBooksProvider } from "./googleBooks";
import { ndlProvider } from "./ndl";
import { openLibraryProvider } from "./openLibrary";
import { readmooProvider } from "./readmoo";
import {
  BookMetadata,
  Candidate,
  EnrichableField,
  ENRICHABLE_FIELDS,
  MetadataProvider,
  isBlank,
  missingFields,
} from "./types";

export { ENRICHABLE_FIELDS, missingFields } from "./types";
export type { BookMetadata, EnrichableField } from "./types";

/**
 * 全部都是免費、免申請的來源，依「命中率高的排前面」排列：
 * 讀墨是靜態網頁爬蟲（中文書的作者／出版社／字數）、Google Books 涵蓋日英中三種語言、
 * 國會圖書館補日文書的書目、Open Library 收西文書。
 * 中文書的「頁數」多半只有實體書通路才有，以字數為主。
 */
const PROVIDERS: MetadataProvider[] = [
  readmooProvider,
  googleBooksProvider,
  ndlProvider,
  openLibraryProvider,
];

/** 低於這個相似度就當作搜到別本書，寧可留白也不要寫錯資料 */
const MIN_TITLE_SIMILARITY = 0.75;

/** 跨來源合併時要求更像，否則會把兩本不同的書混成一筆 */
const MIN_CROSS_SOURCE_SIMILARITY = 0.85;

function bestCandidate(candidates: Candidate[], query: string): Candidate | null {
  let best: Candidate | null = null;
  let bestScore = MIN_TITLE_SIMILARITY;
  for (const candidate of candidates) {
    const score = titleSimilarity(candidate.title, query);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}

async function lookup(provider: MetadataProvider, query: string): Promise<BookMetadata | null> {
  try {
    const candidates = await provider.findCandidates(query);
    const match = bestCandidate(candidates, query);
    if (!match) return null;
    return await provider.fetchDetail(match.url);
  } catch {
    return null;
  }
}

/**
 * 依序問每個來源，把還缺的欄位補起來。
 * 已經填好的欄位不會被後面的來源覆蓋，全部補齊就提早結束。
 */
export async function fetchBookMetadata(
  query: string,
  wanted: readonly EnrichableField[] = ENRICHABLE_FIELDS
): Promise<BookMetadata | null> {
  const merged: BookMetadata = {};
  const sources: string[] = [];

  // 頁數與字數只要有一個就算補到了，理由見 missingFields
  const satisfied = (field: EnrichableField) =>
    field === "pageCount" || field === "wordCount"
      ? !isBlank(merged.pageCount) || !isBlank(merged.wordCount)
      : !isBlank(merged[field]);

  for (const provider of PROVIDERS) {
    if (wanted.every(satisfied)) break;

    const result = await lookup(provider, query);
    if (!result) continue;

    // 已經有書名了，就要求後面的來源指的是同一本書，
    // 免得把 A 書的頁數寫到 B 書上
    if (
      merged.title &&
      result.title &&
      titleSimilarity(result.title, merged.title) < MIN_CROSS_SOURCE_SIMILARITY
    ) {
      continue;
    }

    let used = false;
    for (const field of wanted) {
      if (isBlank(merged[field]) && !isBlank(result[field])) {
        merged[field] = result[field];
        used = true;
      }
    }
    if (used) {
      sources.push(provider.name);
      merged.sourceUrl ??= result.sourceUrl;
    }
  }

  if (sources.length === 0) return null;
  merged.source = sources.join("、");
  return merged;
}

/** 只補書本目前空著的欄位，使用者自己填的內容一律不動 */
export function mergeEnrichment(book: Book, metadata: BookMetadata): Partial<Book> {
  const patch: Partial<Book> = {};
  for (const field of missingFields(book)) {
    if (!isBlank(metadata[field])) {
      patch[field] = metadata[field];
    }
  }
  return patch;
}

/** 給「用書名搜尋」用：回傳多筆候選讓使用者自己挑 */
export async function searchBooks(query: string): Promise<BookMetadata[]> {
  const perProvider = await Promise.all(
    PROVIDERS.map(async (provider) => {
      try {
        const candidates = await provider.findCandidates(query);
        const top = candidates
          .map((c) => ({ c, score: titleSimilarity(c.title, query) }))
          .filter(({ score }) => score >= MIN_TITLE_SIMILARITY)
          .sort((a, b) => b.score - a.score)
          .slice(0, 3);

        const details = await Promise.all(top.map(({ c }) => provider.fetchDetail(c.url)));
        return details.filter((d): d is BookMetadata => d !== null);
      } catch {
        return [];
      }
    })
  );

  return perProvider.flat();
}
