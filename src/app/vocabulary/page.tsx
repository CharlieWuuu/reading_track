"use client";

import { BooksGate } from "@/components/layout/BooksGate";
import { PageBody } from "@/components/layout/PageBody";
import { PageHeader } from "@/components/layout/PageHeader";
import { VocabularySection } from "@/components/notes/VocabularySection";

export default function VocabularyPage() {
  return (
    <>
      <PageHeader title="單字" />
      <PageBody>
        <BooksGate>{(books) => <VocabularySection books={books} />}</BooksGate>
      </PageBody>
    </>
  );
}
