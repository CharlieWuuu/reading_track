import { eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import { bookTypes } from "@/lib/db/schema/taxonomy";
import { makeTestDb } from "@/lib/db/test/pglite";

vi.mock("@/lib/db/client", async () => {
  const { makeTestDb } = await import("@/lib/db/test/pglite");
  return { db: await makeTestDb() };
});

const { readPrivacySettings } = await import("./settings");
const { db } = await import("@/lib/db/client");

/** 種一棵 政治 → 選舉 → 地方選舉 的三層樹，回傳每一層的 id */
async function seedTree() {
  const [root] = await db
    .insert(bookTypes)
    .values({ name: "政治" })
    .returning({ id: bookTypes.id });
  const [mid] = await db
    .insert(bookTypes)
    .values({ name: "選舉", parentId: root.id })
    .returning({ id: bookTypes.id });
  await db.insert(bookTypes).values({ name: "地方選舉", parentId: mid.id });
  await db.insert(bookTypes).values({ name: "文學" }); // 沒被標的另一棵
  return root;
}

describe("readPrivacySettings 的私人類型", () => {
  it("沒有標任何東西時是空的", async () => {
    await seedTree();
    const { privateTypes } = await readPrivacySettings("passcode");
    expect(privateTypes).toEqual([]);
  });

  it("標了父節點，底下每一層都算私人——包含孫節點", async () => {
    const root = await seedTree();
    await db.update(bookTypes).set({ isPrivate: true }).where(eq(bookTypes.id, root.id));

    const { privateTypes } = await readPrivacySettings("passcode");
    expect(new Set(privateTypes)).toEqual(new Set(["政治", "選舉", "地方選舉"]));
  });

  it("沒被標的那一棵不受影響", async () => {
    const root = await seedTree();
    await db.update(bookTypes).set({ isPrivate: true }).where(eq(bookTypes.id, root.id));

    const { privateTypes } = await readPrivacySettings("passcode");
    expect(privateTypes).not.toContain("文學");
  });
});
