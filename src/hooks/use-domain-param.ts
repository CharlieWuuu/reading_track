"use client";

import { useCallback } from "react";
import { useUrlParams } from "./use-url-param";

/** 概覽頁的領域篩選，放網址 ?domain=；單選，再點同一個就取消 */
export function useDomainParam() {
  const { searchParams, setParams } = useUrlParams();
  const domain = searchParams.get("domain");
  const toggle = useCallback(
    (name: string) => setParams({ domain: name === domain ? null : name }),
    [domain, setParams],
  );
  return { domain, toggle };
}
