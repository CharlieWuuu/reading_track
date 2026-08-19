import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PRIMITIVES } from "@/styles/tokens";

/** globals.css 第一個 @theme 區塊就是 primitive 層，semantic 那兩塊只有 var() 不是色票 */
function cssPrimitives(): Record<string, string> {
  const css = readFileSync("src/app/globals.css", "utf8");
  const block = css.match(/@theme\s*\{([^}]*)\}/g) ?? [];
  const entries = [...block.join("\n").matchAll(/--color-([a-z]+-\d+):\s*(#[0-9a-f]{6})/g)];
  return Object.fromEntries(entries.map(([, name, hex]) => [name, hex]));
}

describe("design token 兩份來源同步", () => {
  it("tokens.ts 與 globals.css 的 primitive 完全一致", () => {
    expect(PRIMITIVES).toEqual(cssPrimitives());
  });

  it("色票寫成小寫六碼，比對才不會因為大小寫假性通過", () => {
    for (const hex of Object.values(PRIMITIVES)) expect(hex).toMatch(/^#[0-9a-f]{6}$/);
  });
});
