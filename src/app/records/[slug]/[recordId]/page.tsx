"use client";

import { use } from "react";
import { KindRecordPage } from "@/features/kinds/kind-route-shell";

export default function RecordsRecordPage({
  params,
}: {
  params: Promise<{ slug: string; recordId: string }>;
}) {
  const { slug, recordId } = use(params);
  return <KindRecordPage group="records" slug={slug} recordId={recordId} />;
}
