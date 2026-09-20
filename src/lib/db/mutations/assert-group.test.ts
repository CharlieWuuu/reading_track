import { and, eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import { kinds } from "@/lib/db/schema/kinds";
import { seedUser } from "@/lib/db/test/factories";

vi.mock("@/lib/db/client", async () => {
  const { makeTestDb } = await import("@/lib/db/test/pglite");
  return { db: await makeTestDb() };
});

const { addFragment } = await import("./fragment-modules");
const { addWritingFromValues } = await import("./writings");
const { addRecord } = await import("./catalog");
const { db } = await import("@/lib/db/client");
const userId = await seedUser(db);

async function kindIdOf(slug: string): Promise<string> {
  const [kind] = await db
    .select({ id: kinds.id })
    .from(kinds)
    .where(and(eq(kinds.userId, userId), eq(kinds.slug, slug)));
  return kind.id;
}

/**
 * 寫錯表的防線。
 *
 * 「思緒」（writings）曾經有兩筆寫進了 domain_fragments——沒有人擋，
 * 也沒有人發現，直到側欄的計數跟清單對不上，而那兩筆在畫面上點不到。
 * 這幾條測試就是讓那件事沒辦法再悄悄發生。
 */
describe("寫入時擋下跨 group 的類型", () => {
  it("書寫的類型不能寫進片段表", async () => {
    const thoughts = await kindIdOf("thoughts");
    await expect(addFragment(userId, thoughts, { title: "寫錯表了" })).rejects.toThrow(
      /屬於 writings/,
    );
  });

  it("片段的類型不能寫進書寫表", async () => {
    const quotes = await kindIdOf("quotes");
    await expect(addWritingFromValues(userId, quotes, { title: "寫錯表了" })).rejects.toThrow(
      /屬於 fragments/,
    );
  });

  it("片段的類型不能寫進紀錄表", async () => {
    const quotes = await kindIdOf("quotes");
    await expect(addRecord(userId, quotes, { title: "寫錯表了" })).rejects.toThrow(
      /屬於 fragments/,
    );
  });

  it("對的 group 照樣寫得進去", async () => {
    const quotes = await kindIdOf("quotes");
    const id = await addFragment(userId, quotes, { title: "這句是對的" });
    expect(id).toBeTruthy();
  });

  it("認不得的類型也擋下來，不是默默寫進去", async () => {
    await expect(
      addFragment(userId, "00000000-0000-0000-0000-000000000000", { title: "沒有這個類型" }),
    ).rejects.toThrow(/找不到類型/);
  });
});
