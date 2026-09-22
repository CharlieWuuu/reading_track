"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ForceGraphMethods } from "react-force-graph-2d";
import { Spinner } from "@/components/ui/spinner";
import { useGraph } from "@/hooks/use-graph";
import type { GraphData, GraphNode } from "@/types/graph";

/** force graph 直接碰 window 與 canvas，不能在伺服器端預先產生 */
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => <Loading />,
});

function Loading() {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner size={20} className="text-gray-400" />
    </div>
  );
}

const GROUP_TOKEN: Record<string, string> = {
  records: "--color-series-1",
  fragments: "--color-series-2",
  writings: "--color-series-3",
};

/** canvas 畫不了 var()，畫之前把 token 解成字面色。只在瀏覽器叫得到 */
function groupColors(): Record<string, string> {
  const style = getComputedStyle(document.documentElement);
  return Object.fromEntries(
    Object.entries(GROUP_TOKEN).map(([group, token]) => [
      group,
      style.getPropertyValue(token).trim(),
    ]),
  );
}

/** 容器寬高：force graph 要數字，拿不到就不畫 */
function useSize(ref: React.RefObject<HTMLDivElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height }),
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}

/**
 * 收緊佈局。預設 link 30、charge -30，整張圖攤得太開：
 * 邊變短把相連的拉近，斥力變弱讓孤點不被推到外圈。
 *
 * d3Force 型別只保證是個函式，distance／strength 是 d3 各自的擴充，得自己斷言。
 */
function useTightLayout(graph: GraphData) {
  const ref = useRef<ForceGraphMethods | undefined>(undefined);
  useEffect(() => {
    const link = ref.current?.d3Force("link") as { distance?: (d: number) => void } | undefined;
    const charge = ref.current?.d3Force("charge") as { strength?: (s: number) => void } | undefined;
    link?.distance?.(14);
    charge?.strength?.(-12);
  }, [graph]); // 換了資料 force 會重建，要再設一次
  return ref;
}

/**
 * 站內連結的關係圖。三個 group 各一個顏色，孤點照樣顯示——
 * 沒連過的散在外圈，看得出誰還沒接上。
 */
export function GraphPanel() {
  const { graph, loading } = useGraph();
  const box = useRef<HTMLDivElement>(null);
  const { width, height } = useSize(box);
  const forceRef = useTightLayout(graph);
  const colors = useMemo(() => (width ? groupColors() : {}), [width]); // 有寬度代表已經在瀏覽器

  return (
    <div ref={box} className="h-[70vh] w-full bg-[var(--color-surface-viz)]">
      {loading || !width ? (
        <Loading />
      ) : (
        <ForceGraph2D
          width={width}
          height={height}
          graphData={graph}
          nodeId="id"
          nodeLabel={(n) => `${(n as GraphNode).label}（${(n as GraphNode).kindName}）`}
          nodeColor={(n) => colors[(n as GraphNode).groupKey] ?? "#999"}
          nodeRelSize={4}
          linkColor={() => "rgba(0,0,0,0.15)"}
          cooldownTicks={100}
          ref={forceRef}
        />
      )}
    </div>
  );
}
