"use client";

import { use } from "react";
import { KindListPage } from "@/features/kinds/kind-route-shell";

export default function FragmentsKindPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <KindListPage group="fragments" slug={slug} />;
}
