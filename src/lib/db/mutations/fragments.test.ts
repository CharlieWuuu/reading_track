import { eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import { fragments } from "@/lib/db/schema/fragments";
import { makeBook, seedUser } from "@/lib/db/test/factories";
import { EMPTY_VOCABULARY, VocabularyRow } from "@/types/record";

vi.mock("@/lib/db/client", async () => {
  const { makeTestDb } = await import("@/lib/db/test/pglite");
  return { db: await makeTestDb() };
});

const { addVocabulary } = await import("./fragments");
const { addBookRow } = await import("./books");
const { db } = await import("@/lib/db/client");
const userId = await seedUser(db);

function makeWord(patch: Partial<VocabularyRow> = {}): VocabularyRow {
  return { id: crypto.randomUUID(), bookId: "", bookTitle: "", ...EMPTY_VOCABULARY, ...patch };
}

describe("addVocabulary", () => {
  it("不掛書也存得下來", async () => {
    await addVocabulary(userId, "", makeWord({ word: "邂逅" }));

    const [row] = await db.select().from(fragments).where(eq(fragments.name, "邂逅"));
    expect(row.workId).toBeNull();
  });

  it("掛了書就記在那個作品上", async () => {
    const book = makeBook({ title: "資本論" });
    await addBookRow(userId, book);

    await addVocabulary(userId, book.id, makeWord({ word: "剩餘價值" }));

    const [row] = await db.select().from(fragments).where(eq(fragments.name, "剩餘價值"));
    expect(row.workId).not.toBeNull();
  });

  it("空白的字不留列", async () => {
    await addVocabulary(userId, "", makeWord({ word: "   " }));

    const rows = await db.select().from(fragments).where(eq(fragments.name, "   "));
    expect(rows).toHaveLength(0);
  });
});
