"use client";

import { useState } from "react";
import { VocabularyEdit, VocabularyEditDialog } from "@/components/notes/VocabularyEditDialog";
import { VocabularyPanel } from "@/components/notes/VocabularyPanel";
import { useRecords } from "@/lib/useRecords";
import { getVocabularyEntries, VocabularyEntry } from "@/lib/vocabularyStats";
import { Book } from "@/types/book";

/** 單字清單與它的編輯視窗：桌機是自己一頁，手機是筆記頁的一個分頁 */
export function VocabularySection({ books }: { books: Book[] }) {
  const { vocabulary, saveBookRows } = useRecords();
  const [editing, setEditing] = useState<VocabularyEntry | null>(null);

  /**
   * 一個詞可能來自好幾本書，改的是各自那一列。
   * 寫回去是「整本書的紀錄換一批」，所以先按書分組，一本送一次。
   */
  async function save(edits: VocabularyEdit[]) {
    const touched = new Set(edits.map((edit) => edit.bookId));

    for (const bookId of touched) {
      const kept = edits.filter((edit) => edit.bookId === bookId && !edit.deleted);
      const untouched = vocabulary.filter(
        (row) => row.bookId === bookId && !edits.some((edit) => edit.id === row.id),
      );
      const book = books.find((b) => b.id === bookId);
      await saveBookRows("vocabulary", bookId, book?.title ?? "", [...untouched, ...kept]);
    }
  }

  return (
    <>
      <VocabularyPanel entries={getVocabularyEntries(vocabulary, books)} onEdit={setEditing} />

      {editing && (
        <VocabularyEditDialog entry={editing} onSave={save} onClose={() => setEditing(null)} />
      )}
    </>
  );
}
