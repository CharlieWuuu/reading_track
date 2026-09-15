"use client";

import { use } from "react";
import { groupParam } from "@/features/kinds/group-param";
import { KindEditPage } from "@/features/kinds/kind-route-shell";

export default function EditPage({
  params,
}: {
  params: Promise<{ group: string; slug: string; recordId: string }>;
}) {
  const { group, slug, recordId } = use(params);
  return <KindEditPage group={groupParam(group)} slug={slug} recordId={recordId} />;
}
