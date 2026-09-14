"use client";

import { use } from "react";
import { KindEditPage } from "@/features/kinds/kind-route-shell";

/**
 * 走通用的編輯頁。這一種本來有自己的表單，但欄位跟通用的是同一組——
 * 兩支表單只會讓同一種東西在新增與編輯看起來不一樣。
 */
export default function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <KindEditPage group="fragments" slug="quotes" recordId={id} />;
}
