"use client";

import { Suspense } from "react";
import { PageBody } from "@/components/layout/page-body";
import { ReadingHeader } from "@/features/reading/components/reading-header";

/**
 * 清單頁共用的頁首與分頁列。單筆頁在 (detail) 底下，吃不到這個 layout——
 * 它們要的是返回鍵，不是分頁列。
 */
export default function ReadingListLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ReadingHeader />
      <PageBody>{children}</PageBody>
    </Suspense>
  );
}
