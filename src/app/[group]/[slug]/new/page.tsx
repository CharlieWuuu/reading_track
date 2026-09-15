"use client";

import { use } from "react";
import { groupParam } from "@/features/kinds/group-param";
import { KindNewPage } from "@/features/kinds/kind-route-shell";

export default function KindNewPage_({
  params,
}: {
  params: Promise<{ group: string; slug: string }>;
}) {
  const { group, slug } = use(params);
  return <KindNewPage group={groupParam(group)} slug={slug} />;
}
