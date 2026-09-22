"use client";

import useSWR from "swr";
import type { GraphData } from "@/types/graph";

const EMPTY: GraphData = { nodes: [], links: [] };

async function fetcher(url: string): Promise<GraphData> {
  const res = await fetch(url);
  return (await res.json()) as GraphData;
}

/** 全站站內連結的節點與邊 */
export function useGraph() {
  const { data, isLoading } = useSWR("/api/graph", fetcher);
  return { graph: data ?? EMPTY, loading: isLoading && !data };
}
