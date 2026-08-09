"use client";

import { BooksGate } from "@/components/layout/BooksGate";
import { PageHeader } from "@/components/layout/PageHeader";
import { VocabularySection } from "@/components/notes/VocabularySection";

export default function VocabularyPage() {
  return (
    <>
      <PageHeader title="單字" />
      <BooksGate>{(books) => <VocabularySection books={books} />}</BooksGate>
    </>
  );
}
