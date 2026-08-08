"use client";

import { useState } from "react";
import { BooksGate } from "@/components/layout/BooksGate";
import { PageHeader } from "@/components/layout/PageHeader";
import { VocabularyEdit, VocabularyEditDialog } from "@/components/notes/VocabularyEditDialog";
import { VocabularyPanel } from "@/components/notes/VocabularyPanel";
import { useBookPatch } from "@/lib/useBookPatch";
import { getVocabularyEntries, VocabularyEntry } from "@/lib/vocabularyStats";
import { Book, joinVocabulary, parseVocabulary } from "@/types/book";

function Vocabulary({ books }: { books: Book[] }) {
  const patchBook = useBookPatch();
  const [editing, setEditing] = useState<VocabularyEntry | null>(null);

  /**
   * 單字存在各自的書裡，所以一筆一筆寫回它來的那本書的那一行。
   * 同一本書可能改到多筆，先按書合併再送出，才不會對同一列連打好幾次 PATCH。
   */
  async function save(edits: VocabularyEdit[]) {
    const byBook = new Map<string, VocabularyEdit[]>();
    for (const edit of edits) {
      const list = byBook.get(edit.bookId);
      if (list) list.push(edit);
      else byBook.set(edit.bookId, [edit]);
    }

    for (const [bookId, list] of byBook) {
      const book = books.find((b) => b.id === bookId);
      if (!book) continue;

      const items = parseVocabulary(book.vocabulary);
      const deleted = new Set(list.filter((edit) => edit.deleted).map((edit) => edit.index));
      for (const edit of list) {
        if (edit.deleted) continue;
        items[edit.index] = {
          word: edit.word,
          wordTranslation: edit.wordTranslation,
          sentence: edit.sentence,
          sentenceTranslation: edit.sentenceTranslation,
          chapter: edit.chapter,
          language: edit.language,
        };
      }

      // 刪除是整行拿掉，所以留到最後才過濾——中途刪會讓後面的 index 全部位移
      await patchBook(bookId, {
        vocabulary: joinVocabulary(items.filter((_, i) => !deleted.has(i))),
      });
    }
  }

  return (
    <>
      <VocabularyPanel entries={getVocabularyEntries(books)} onEdit={setEditing} />

      {editing && (
        <VocabularyEditDialog entry={editing} onSave={save} onClose={() => setEditing(null)} />
      )}
    </>
  );
}

export default function VocabularyPage() {
  return (
    <>
      <PageHeader title="單字" />
      <BooksGate>{(books) => <Vocabulary books={books} />}</BooksGate>
    </>
  );
}
