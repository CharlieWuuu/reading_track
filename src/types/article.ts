/**
 * 一篇讀完的文章。期刊論文也記在這裡：欄位幾乎重疊，
 * 專屬欄位（卷期、DOI）等真的記到需要它們的時候再開。
 */
export interface Article {
  id: string;
  title: string;
  /** 文章常常抓不到作者，允許空白 */
  author: string;
  /** 來源站台，例如「報導者」；論文就填期刊名 */
  platform: string;
  sourceUrl: string;
  /**
   * 只有完成日期，沒有開始日期——文章多半一次讀完，
   * 記「哪天讀的」就夠了。有填＝已讀完。
   */
  endDate: string | null;
  domain: string;
  subDomain: string;
  type: string;
  language: string;
  wordCount: string;
  note: string;
  keywords: string;
}
