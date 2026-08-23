import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import * as routes from "./routes";
import { STATS_TYPES, statsHref } from "./stats-views";
import { READING_TABS, readingTabHref } from "./tabs";

/**
 * 路由表是編譯期就知道的東西，所以「連過去沒有那一頁」應該由測試擋，不是點了才發現。
 *
 * 抓到過的實例：`keywordEditHref` 產生 `/keywords/…`，實際的頁在
 * `/reading/keywords/…`——三處連結一路 404，因為那支當時不在這個檔案裡。
 */

const APP = "src/app";

/** app/ 底下每一支 page.tsx 就是一條路由；[id] 那種動態段換成一格萬用 */
function realRoutes(): RegExp[] {
  const patterns: RegExp[] = [];
  (function walk(dir: string) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.name === "page.tsx") {
        const segments = relative(APP, dir)
          .split("/")
          .filter((s) => s && !s.startsWith("(")); // (group) 不出現在網址上
        const source = segments
          .map((s) => (s.startsWith("[") ? "[^/]+" : s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))
          .join("/");
        patterns.push(new RegExp(`^/${source}$`));
      }
    }
  })(APP);
  return patterns;
}

const PATTERNS = realRoutes();

/** 去掉 query 再比：?back= 帶的是另一個網址，那一段由它自己的來源負責 */
const exists = (href: string) => PATTERNS.some((p) => p.test(href.split("?")[0]));

describe("routes.ts 產生的網址都有對應的頁", () => {
  const cases: Array<[string, string]> = Object.entries(routes)
    .filter(
      (entry): entry is [string, (...args: string[]) => string] => typeof entry[1] === "function",
    )
    .map(([name, build]) => [name, build("x", "y")]);

  it.each(cases)("%s → %s", (_name, href) => {
    expect(exists(href), `${href} 沒有對應的 page.tsx`).toBe(true);
  });
});

/**
 * 分頁的 key 就是網址的一段。`/stats/writings` 曾經一路 404——key 寫成複數而
 * 資料夾是單數，而網址是 `/stats/${next}` 拼出來的，字面路徑那組掃不到。
 */
describe("分頁的 key 都有對應的頁", () => {
  it.each(READING_TABS.map((t) => t.key))("/reading/%s", (key) => {
    expect(exists(readingTabHref(key)), `${readingTabHref(key)} 沒有對應的 page.tsx`).toBe(true);
  });

  it.each(STATS_TYPES.map((t) => t.key))("/stats/%s", (key) => {
    const href = statsHref(key, "chart");
    expect(exists(href), `${href} 沒有對應的 page.tsx`).toBe(true);
  });
});

describe("寫死在畫面上的網址都有對應的頁", () => {
  /** 只收頁面路徑：/api 是另一套命名，不在這裡對照 */
  const TOP_LEVEL = readdirSync(APP, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== "api" && !e.name.startsWith("("))
    .map((e) => e.name);

  function sourceFiles(dir: string, found: string[] = []): string[] {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) sourceFiles(path, found);
      else if (/\.tsx?$/.test(entry.name) && !/\.(test|stories)\.tsx?$/.test(entry.name))
        found.push(path);
    }
    return found;
  }

  // 只抓完整的字面路徑：含 ${} 的樣板由上面那組 helper 的測試涵蓋
  const literal = new RegExp(`"(/(?:${TOP_LEVEL.join("|")})(?:/[a-zA-Z0-9\\-_]+)*)"`, "g");

  const found = sourceFiles("src").flatMap((file) =>
    [...readFileSync(file, "utf8").matchAll(literal)].map(
      (m) => [relative("src", file), m[1]] as const,
    ),
  );

  it("掃得到字面路徑（正則沒有失效）", () => {
    expect(found.length).toBeGreaterThan(10);
  });

  it.each([...new Map(found.map((f) => [f[1], f])).values()])("%s 的 %s", (_file, href) => {
    expect(exists(href), `${href} 沒有對應的 page.tsx`).toBe(true);
  });
});
