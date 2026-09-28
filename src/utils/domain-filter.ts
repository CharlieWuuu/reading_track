type HasDomain = { domain: string };

/** 領域排序：照中文筆畫，空的不列 */
export const sortDomains = (names: readonly string[]): string[] =>
  [...new Set(names)].filter(Boolean).sort((a, b) => a.localeCompare(b, "zh-Hant"));

/** 這批資料用到哪些領域 */
export const domainsOf = (rows: readonly HasDomain[]): string[] =>
  sortDomains(rows.map((row) => row.domain));

/** 沒選就全部通過 */
export const inDomain =
  (domain: string | null) =>
  (row: HasDomain): boolean =>
    !domain || row.domain === domain;
