"use client";

import { use } from "react";
import { groupParam } from "@/features/kinds/group-param";
import { KindRecordPage } from "@/features/kinds/kind-route-shell";

export default function RecordPage({
  params,
}: {
  params: Promise<{ group: string; slug: string; recordId: string }>;
}) {
  const { group, slug, recordId } = use(params);
  return <KindRecordPage group={groupParam(group)} slug={slug} recordId={recordId} />;
}
