// 幾段文字接成一段內文：空的跳過，段與段之間空一行
export const joinParagraphs = (parts: readonly (string | null | undefined)[]): string =>
  parts.filter((part): part is string => Boolean(part?.trim())).join("\n\n");
