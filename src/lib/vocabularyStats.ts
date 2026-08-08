import { Book, parseVocabulary } from "@/types/book";

export type VocabularyEncounter = {
  word: string;
  wordTranslation: string;
  sentence: string;
  sentenceTranslation: string;
  chapter: string;
  /** 沒特別填就是書的語言 */
  language: string;
  bookId: string;
  bookTitle: string;
  bookCover: string;
  /** 在那本書的單字欄裡是第幾筆；要改回去就得知道改哪一行 */
  index: number;
};

export type VocabularyEntry = {
  word: string;
  /** 同一個詞在不同書裡是不同的相遇，所以一本一筆、不合併 */
  encounters: VocabularyEncounter[];
};

export function getVocabularyEntries(books: Book[]): VocabularyEntry[] {
  const map = new Map<string, VocabularyEncounter[]>();

  for (const book of books) {
    parseVocabulary(book.vocabulary).forEach((item, index) => {
      if (!item.word) return;
      const encounter = {
        ...item,
        // 沒填就跟著書走，這是絕大多數的情況
        language: item.language || book.language,
        bookId: book.id,
        bookTitle: book.title,
        bookCover: book.coverUrl,
        index,
      };
      const list = map.get(item.word);
      if (list) list.push(encounter);
      else map.set(item.word, [encounter]);
    });
  }

  return [...map.entries()]
    .map(([word, encounters]) => ({ word, encounters }))
    .sort(
      (a, b) =>
        b.encounters.length - a.encounters.length || a.word.localeCompare(b.word, "zh-Hant"),
    );
}
