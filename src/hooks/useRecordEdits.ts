"use client";

import { useRecords } from "@/hooks/useRecords";
import { Book } from "@/types/book";
import { VocabularyRow } from "@/types/record";
import { QuoteRecord } from "@/utils/vocabularyStats";

/** 一次要改的一筆單字，加上「這一列要不要留」 */
export type VocabularyEdit = VocabularyRow & { deleted?: boolean };

/**
 * 單字與佳句都是「整本書的紀錄換一批」寫回去的，所以存檔前要把那本書
 * 沒被動到的列原樣帶上。編輯頁與書籍頁共用這兩支，寫法只有一份。
 */
export function useRecordEdits(books: Book[]) {
  const { vocabulary, quotes, saveBookRows } = useRecords();

  /** 一個詞可能來自好幾本書，改的是各自那一列，所以先按書分組、一本送一次 */
  async function saveVocabulary(edits: VocabularyEdit[]) {
    for (const bookId of new Set(edits.map((edit) => edit.bookId))) {
      const kept = edits.filter((edit) => edit.bookId === bookId && !edit.deleted);
      const untouched = vocabulary.filter(
        (row) => row.bookId === bookId && !edits.some((edit) => edit.id === row.id),
      );
      const book = books.find((b) => b.id === bookId);
      await saveBookRows("vocabulary", bookId, book?.title ?? "", [...untouched, ...kept]);
    }
  }

  async function saveQuote(record: QuoteRecord, remove: boolean) {
    const others = quotes.filter((row) => row.bookId === record.bookId && row.id !== record.id);
    const next = remove ? others : [...others, record];
    const book = books.find((b) => b.id === record.bookId);
    await saveBookRows("quotes", record.bookId, book?.title ?? "", next);
  }

  return { saveVocabulary, saveQuote };
}
