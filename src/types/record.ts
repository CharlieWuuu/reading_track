/**
 * 單字與佳句從書籍表的儲存格搬出來，各自一張表、一列一筆。
 *
 * 每一列都同時存書籍編號與書名：編號是真正的 join key（不會變），
 * 書名純粹是給人看的，寫入時由 app 補上——只靠編號的話，
 * 直接查資料庫時會看到一整排 UUID，那就等於放棄可讀性了。
 */
export interface VocabularyRow {
  id: string;
  bookId: string;
  bookTitle: string;
  word: string;
  /** 怎麼唸：拼音、假名、KK 音標都可以，這一格不規定寫法 */
  pronunciation: string;
  wordTranslation: string;
  sentence: string;
  sentenceTranslation: string;
  chapter: string;
  /** 空字串代表跟著書的語言走 */
  language: string;
}

export interface QuoteRow {
  id: string;
  bookId: string;
  bookTitle: string;
  text: string;
  chapter: string;
  /** 這一句的心得，跟整本書的心得（書籍表的筆記欄）是兩回事 */
  note: string;
}

export const EMPTY_VOCABULARY: Omit<VocabularyRow, "id" | "bookId" | "bookTitle"> = {
  word: "",
  pronunciation: "",
  wordTranslation: "",
  sentence: "",
  sentenceTranslation: "",
  chapter: "",
  language: "",
};

export const EMPTY_QUOTE: Omit<QuoteRow, "id" | "bookId" | "bookTitle"> = {
  text: "",
  chapter: "",
  note: "",
};
