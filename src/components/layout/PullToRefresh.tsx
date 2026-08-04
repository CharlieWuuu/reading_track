"use client";

import { RefObject, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useSWRConfig } from "swr";

/** 拉多長才觸發（px）。太短會誤觸，太長要拉到手酸 */
const THRESHOLD = 72;

/**
 * 手機的下拉重新整理。
 *
 * 手機頂欄擺一顆重新整理按鈕，等於為了偶爾用一次的動作永久佔掉一條高度；
 * 下拉是手機上本來就會的手勢，不佔任何版面。桌機仍然用側欄的按鈕。
 */
export function PullToRefresh({ scrollRef }: { scrollRef: RefObject<HTMLElement | null> }) {
  const { mutate } = useSWRConfig();
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    let startY: number | null = null;

    function onTouchStart(e: TouchEvent) {
      // 只有在最頂端往下拉才算，否則會跟正常捲動打架
      startY = el!.scrollTop <= 0 ? e.touches[0].clientY : null;
    }

    function onTouchMove(e: TouchEvent) {
      if (startY === null) return;
      const delta = e.touches[0].clientY - startY;
      // 拉的距離打折，才有「被拉住」的手感，也不會一滑就觸發
      setPull(delta > 0 ? Math.min(delta * 0.4, THRESHOLD * 1.5) : 0);
    }

    async function onTouchEnd() {
      const shouldRefresh = pull >= THRESHOLD;
      startY = null;
      setPull(0);
      if (!shouldRefresh || refreshing) return;

      setRefreshing(true);
      try {
        await mutate(() => true);
      } finally {
        setRefreshing(false);
      }
    }

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [scrollRef, pull, refreshing, mutate]);

  const visible = pull > 0 || refreshing;
  if (!visible) return null;

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-10 flex justify-center md:hidden"
      style={{ transform: `translateY(${refreshing ? THRESHOLD / 2 : pull}px)` }}
    >
      <span className="rounded-full border bg-white p-1.5 text-gray-500 shadow-sm">
        <RefreshCw
          size={16}
          className={refreshing ? "animate-spin" : ""}
          style={{ transform: refreshing ? undefined : `rotate(${pull * 3}deg)` }}
        />
      </span>
    </div>
  );
}
