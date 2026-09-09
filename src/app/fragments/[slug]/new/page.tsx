"use client";

import { use } from "react";
import { KindNewPage } from "@/features/kinds/kind-route-shell";

export default function FragmentsKindNewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <KindNewPage group="fragments" slug={slug} />;
}
