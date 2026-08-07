import type { Page } from "playwright-core";

export async function getMeta(page: Page, property: string): Promise<string> {
  const el = await page.$(`meta[property="${property}"], meta[name="${property}"]`);
  if (!el) return "";
  return (await el.getAttribute("content")) ?? "";
}

export async function getText(page: Page, selector: string): Promise<string> {
  const el = await page.$(selector);
  if (!el) return "";
  return (await el.textContent())?.trim() ?? "";
}

export async function getJsonLd(page: Page, type: string): Promise<Record<string, unknown> | null> {
  const scripts = await page.$$('script[type="application/ld+json"]');
  for (const script of scripts) {
    const content = await script.textContent();
    if (!content) continue;
    try {
      const data = JSON.parse(content);
      const items = Array.isArray(data) ? data : [data];
      const match = items.find((item) => item["@type"] === type);
      if (match) return match;
    } catch {
      continue;
    }
  }
  return null;
}
