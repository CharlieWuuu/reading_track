import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import StyleDictionary from "style-dictionary";
import { describe, expect, it } from "vitest";
import config from "../../style-dictionary.config.mjs";

/**
 * 產出物有進版控，所以要擋「改了 JSON 忘記跑 npm run tokens」。
 * 重跑一次到暫存目錄，跟 repo 裡的逐字比對。
 */
async function rebuild(): Promise<Record<string, string>> {
  const out = mkdtempSync(join(tmpdir(), "tokens-"));
  const platforms = Object.fromEntries(
    Object.entries(config.platforms).map(([key, p]) => [key, { ...p, buildPath: `${out}/` }]),
  );
  await new StyleDictionary({
    ...config,
    platforms,
    log: { verbosity: "silent" },
  }).buildAllPlatforms();
  return Object.fromEntries(
    Object.values(config.platforms).flatMap((p) =>
      p.files.map((f) => [f.destination, readFileSync(join(out, f.destination), "utf8")]),
    ),
  );
}

describe("design token 產出物是最新的", () => {
  it("重跑 style-dictionary 的結果與版控裡的一致", async () => {
    const fresh = await rebuild();
    for (const [name, content] of Object.entries(fresh)) {
      expect(
        readFileSync(`src/styles/generated/${name}`, "utf8"),
        `${name} 過期，跑 npm run tokens`,
      ).toBe(content);
    }
  });
});
