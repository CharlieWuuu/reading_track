"use client";

import { useState } from "react";
import { KeywordCard } from "@/components/keywords/KeywordCard";
import { KeywordPopup } from "@/components/keywords/KeywordPopup";
import { CardMasonry } from "@/components/ui/CardMasonry";
import { getKeywordEntries } from "@/lib/keywordStats";
import { useKeywordInfos } from "@/lib/useKeywordInfos";
import { Book } from "@/types/book";

const styles = {
  empty: "py-6 text-center text-xs text-gray-400",
};

/** 關鍵字卡片牆：關鍵字頁與手機的筆記頁共用，點一張就進那個字的編輯頁 */
export function KeywordCards({ books }: { books: Book[] }) {
  const { byName } = useKeywordInfos();
  const [viewing, setViewing] = useState<string | null>(null);
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
            onEdit={() => setViewing(entry.name)}
          />
        ))}
      </CardMasonry>

      {viewing && <KeywordPopup name={viewing} onClose={() => setViewing(null)} />}
    </>
  );
}
