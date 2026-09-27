"use client";

import { use } from "react";
import { groupParam } from "@/features/kinds/group-param";
import { KindListPage } from "@/features/kinds/kind-list-page";

type KindPageProps = {
  params: Promise<{ group: string; slug: string }>;
};

export default function KindPage({ params }: KindPageProps) {
  const { group, slug } = use(params);
  return <KindListPage group={groupParam(group)} slug={slug} />;
}
