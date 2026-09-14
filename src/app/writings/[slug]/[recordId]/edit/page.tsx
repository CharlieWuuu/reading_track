"use client";

import { use } from "react";
import { KindEditPage } from "@/features/kinds/kind-route-shell";

export default function EditPage({
  params,
}: {
  params: Promise<{ slug: string; recordId: string }>;
}) {
  const { slug, recordId } = use(params);
  return <KindEditPage group="writings" slug={slug} recordId={recordId} />;
}
