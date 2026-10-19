/** 字典回應換成表單的欄位鍵。只做轉換，不連網 */

type MoedictHeteronym = { b?: string; d?: Array<{ f?: string }> };
export type MoedictEntry = { h?: MoedictHeteronym[] };

type WiktionaryEntry = { partOfSpeech?: string; definitions?: Array<{ definition?: string }> };
export type WiktionaryResponse = Record<string, WiktionaryEntry[]>;

const MAX_DEFINITIONS = 3;

/** 萌典用反引號與波浪號標連結（`學~`習~），讀起來是雜訊 */
const plainMoedict = (text: string) => text.replace(/[`~]/g, "").trim();

const stripHtml = (html: string) =>
  html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();

const joined = (parts: string[]) => parts.filter(Boolean).slice(0, MAX_DEFINITIONS).join("；");

/** 注音放發音，前幾條釋義放解釋；只取第一個讀音，多音字的其餘讀音留給使用者 */
export function moedictFields(entry: MoedictEntry): Record<string, string> | null {
  const first = entry.h?.[0];
  if (!first) return null;
  const translation = joined((first.d ?? []).map((d) => plainMoedict(d.f ?? "")));
  if (!translation) return null;
  return { pronunciation: first.b ?? "", translation };
}

/** 英文詞典：詞性加前幾條釋義。其他語言的同形詞不收，免得英文單字配到法文解釋 */
export function wiktionaryFields(data: WiktionaryResponse): Record<string, string> | null {
  const first = data.en?.[0];
  if (!first) return null;
  const definitions = joined((first.definitions ?? []).map((d) => stripHtml(d.definition ?? "")));
  if (!definitions) return null;
  return {
    translation: first.partOfSpeech ? `${first.partOfSpeech}：${definitions}` : definitions,
  };
}
