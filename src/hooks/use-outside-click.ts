"use client";

import { useEffect, useRef } from "react";

/**
 * 點到框外就收起來。回傳的 ref 掛在「算框內」的那一層。
 *
 * 用 mousedown 而不是 click：click 要等放開，中間手指移出去就不算數了。
 */
export function useOutsideClick<T extends HTMLElement>(active: boolean, onOutside: () => void) {
  const ref = useRef<T>(null);
  const handler = useRef(onOutside);

  // 收在 effect 裡才不算「render 期間改 ref」；掛 listener 的那個 effect 就不用把它列進相依
  useEffect(() => {
    handler.current = onOutside;
  });

  useEffect(() => {
    if (!active) return;
    function onPointerDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) handler.current();
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [active]);

  return ref;
}
