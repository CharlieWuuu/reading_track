"use client";

import { useState } from "react";
import { KeywordCard } from "@/components/keywords/KeywordCard";
import { KeywordEditDialog } from "@/components/keywords/KeywordEditDialog";
import { CardMasonry } from "@/components/ui/CardMasonry";
import { getKeywordEntries } from "@/lib/keywordStats";
import { useKeywordInfos } from "@/lib/useKeywordInfos";
import { Book } from "@/types/book";
import { EMPTY_KEYWORD_INFO } from "@/types/keyword";

const styles = {
  empty: "py-6 text-center text-xs text-gray-400",
};

/** 關鍵字卡片牆與它的編輯視窗：關鍵字頁與手機的筆記頁共用 */
export function KeywordCards({ books }: { books: Book[] }) {
  const { byName, save, remove } = useKeywordInfos();
  const [editing, setEditing] = useState<string | null>(null);
  const entries = getKeywordEntries(books);

  if (entries.length === 0) {
    return <div className={styles.empty}>還沒有任何關鍵字，先到書籍的「關鍵字」欄記幾個</div>;
  }

  return (
    <>
      <CardMasonry>
        {entries.map((entry) => (
          <KeywordCard
            key={entry.name}
            entry={entry}
            info={byName.get(entry.name)}
            onEdit={() => setEditing(entry.name)}
          />
        ))}
      </CardMasonry>

      {editing && (
        <KeywordEditDialog
          info={byName.get(editing) ?? { name: editing, ...EMPTY_KEYWORD_INFO }}
          onSave={save}
          onDelete={remove}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}
