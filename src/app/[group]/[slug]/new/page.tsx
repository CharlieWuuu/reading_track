"use client";

import { use } from "react";
import { groupParam } from "@/features/kinds/group-param";
import { KindNewPage } from "@/features/kinds/kind-route-shell";

type KindNewPageProps = {
  params: Promise<{ group: string; slug: string }>;
};

export default function KindNewPage_({ params }: KindNewPageProps) {
  const { group, slug } = use(params);
  return <KindNewPage group={groupParam(group)} slug={slug} />;
}
