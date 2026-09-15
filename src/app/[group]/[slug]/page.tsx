"use client";

import { use } from "react";
import { groupParam } from "@/features/kinds/group-param";
import { KindListPage } from "@/features/kinds/kind-route-shell";

export default function KindPage({ params }: { params: Promise<{ group: string; slug: string }> }) {
  const { group, slug } = use(params);
  return <KindListPage group={groupParam(group)} slug={slug} />;
}
