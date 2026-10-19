import { fetchJson } from "@/lib/metadata/http";
import {
  MoedictEntry,
  moedictFields,
  wiktionaryFields,
  WiktionaryResponse,
} from "@/utils/dict-parse";

type Found = Record<string, string> | null;

/** 萌典：繁體中文字詞。查不到回 404，fetchJson 當成 null */
export async function lookupMoedict(word: string): Promise<Found> {
  const entry = await fetchJson<MoedictEntry>(
    `https://www.moedict.tw/a/${encodeURIComponent(word)}.json`,
  );
  return entry ? moedictFields(entry) : null;
}

/** 維基詞典：英文單字 */
export async function lookupWiktionary(word: string): Promise<Found> {
  const data = await fetchJson<WiktionaryResponse>(
    `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`,
  );
  return data ? wiktionaryFields(data) : null;
}
