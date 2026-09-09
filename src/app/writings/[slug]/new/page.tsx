"use client";

import { use } from "react";
import { KindNewPage } from "@/features/kinds/kind-route-shell";

export default function WritingsKindNewPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  return <KindNewPage group="writings" slug={slug} />;
}
