import { Book } from "@/types/book";
import { googleBooksProvider } from "./googleBooks";
import { SourceUnavailableError, titleSimilarity } from "./http";
import { ndlProvider } from "./ndl";
import { openLibraryProvider } from "./openLibrary";
import { pubuProvider } from "./pubu";
import { readmooProvider } from "./readmoo";
import { taazeProvider } from "./taaze";
import {
  BookMetadata,
  Candidate,
  ENRICHABLE_FIELDS,
  EnrichableField,
  isBlank,
  MetadataProvider,
  missingFields,
} from "./types";

export { ENRICHABLE_FIELDS, missingFields } from "./types";
export type { BookMetadata, EnrichableField } from "./types";

/**
 * 全部都是免費、免申請的來源。順序＝「補得到頁數／字數」優先——
 * 一輪查到 wanted 都補齊就會停，所以先問給得出長度的來源，
 * 才不會被只回書名作者的來源把其他欄位填滿、長度卻永遠缺著。
 *
 * 讀冊排在讀墨前面是環境限制：讀墨在機房 IP 會被 CloudFront 擋成 403，
 * 線上只有讀冊與 Pubu 抓得到中文書（讀墨仍留著，本機開發時它的字數最完整）。
 * searchBooks 是所有來源同時發查詢，fetchBookMetadata 才照這個順序補到齊為止。
 */
const PROVIDERS: MetadataProvider[] = [
  taazeProvider, // 中文書頁數
  pubuProvider, // 電子書字數
  readmooProvider, // 電子書字數（線上會被擋，本機才抓得到）
  ndlProvider, // 日文書頁數
  googleBooksProvider, // 頁數（英文書為主）
  openLibraryProvider, // 頁數
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

async function lookup(
  provider: MetadataProvider,
  query: string,
  hints?: LookupHints,
): Promise<BookMetadata | null> {
  const candidates = await provider.findCandidates(query, hints);
  const match = bestCandidate(candidates, query);
  if (!match) return null;
  return await provider.fetchDetail(match.url);
}

export interface LookupHints {
  /** 使用者在 Sheet 標了語言時帶進來，純漢字的日文書名才問得到國會圖書館 */
  language?: string;
}

export interface EnrichResult {
  /** 這次真的補到的欄位；沒補到任何欄位時是 null */
  metadata: BookMetadata | null;
  /** 有來源認得這本書（就算它給不出我們還缺的欄位） */
  matched: boolean;
  /** 這次查詢中壞掉的來源，例如 Google Books 配額用完 */
  unavailable: string[];
}

/**
 * 依序問每個來源，把還缺的欄位補起來。
 * 已經填好的欄位不會被後面的來源覆蓋，全部補齊就提早結束。
 */
export async function fetchBookMetadata(
  query: string,
  wanted: readonly EnrichableField[] = ENRICHABLE_FIELDS,
  hints?: LookupHints,
): Promise<EnrichResult> {
  const merged: BookMetadata = {};
  const sources: string[] = [];
  const unavailable: string[] = [];
  let matched = false;

  const satisfied = (field: EnrichableField) => !isBlank(merged[field]);

  for (const provider of PROVIDERS) {
    if (wanted.every(satisfied)) break;

    let result: BookMetadata | null = null;
    try {
      result = await lookup(provider, query, hints);
    } catch (err) {
      // 來源壞掉（配額、封鎖、連線）要說出來，不能靜靜地當成「這本書查不到」
      if (err instanceof SourceUnavailableError) {
        unavailable.push(`${provider.name}（${err.detail}）`);
      }
      continue;
    }
    if (!result) continue;
    matched = true;

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

  if (sources.length === 0) return { metadata: null, matched, unavailable };
  merged.source = sources.join("、");
  return { metadata: merged, matched, unavailable };
}

/** 只補書本目前空著的欄位，使用者自己填的內容一律不動 */
/**
 * 抓回來的書名比現有的「更完整」時才回傳它，否則回空字串。
 *
 * 更完整＝包含現有書名而且更長，多半是補上副標題（「深度工作力」→
 * 「深度工作力：淺薄時代，個人成功的關鍵能力」）。完全不同的書名一律不動——
 * 那代表配對可能錯了，改掉會讓使用者的書變成別本書。
 */
export function fullerTitle(current: string, candidate: string | undefined): string {
  const now = (current ?? "").trim();
  const next = (candidate ?? "").trim();
  if (!now || !next || next.length <= now.length) return "";

  const loose = (value: string) => value.replace(/\s+/g, "").toLowerCase();
  return loose(next).startsWith(loose(now)) ? next : "";
}

export function mergeEnrichment(book: Book, metadata: BookMetadata): Partial<Book> {
  const patch: Partial<Book> = {};
  for (const field of missingFields(book)) {
    if (!isBlank(metadata[field])) {
      patch[field] = metadata[field];
    }
  }
  // 書名本來就不是空的，所以不在 missingFields 裡；但只要抓到更完整的版本就補上去
  const fuller = fullerTitle(book.title, metadata.title);
  if (fuller) patch.title = fuller;

  // 來源網址不在 ENRICHABLE_FIELDS（它不是書的屬性，是「這次資料哪裡來的」），
  // 但只要原本空著就一併補上，之後才查得回這筆資料的出處
  if (isBlank(book.sourceUrl) && !isBlank(metadata.sourceUrl)) {
    patch.sourceUrl = metadata.sourceUrl;
  }
  return patch;
}

/** 給「用書名搜尋」用：回傳多筆候選讓使用者自己挑 */
export async function searchBooks(query: string, hints?: LookupHints): Promise<BookMetadata[]> {
  const perProvider = await Promise.all(
    PROVIDERS.map(async (provider) => {
      try {
        const candidates = await provider.findCandidates(query, hints);
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
    }),
  );

  return perProvider.flat();
}
