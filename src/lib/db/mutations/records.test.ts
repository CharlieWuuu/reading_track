import { eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import { vocabulary } from "@/lib/db/schema/records";
import { makeBook, seedUser } from "@/lib/db/test/factories";
import { EMPTY_VOCABULARY, VocabularyRow } from "@/types/record";

vi.mock("@/lib/db/client", async () => {
  const { makeTestDb } = await import("@/lib/db/test/pglite");
  return { db: await makeTestDb() };
});

const { addVocabulary } = await import("./records");
const { addBookRow } = await import("./books");
const { db } = await import("@/lib/db/client");
const userId = await seedUser(db);

function makeWord(patch: Partial<VocabularyRow> = {}): VocabularyRow {
  return { id: crypto.randomUUID(), bookId: "", bookTitle: "", ...EMPTY_VOCABULARY, ...patch };
}

describe("addVocabulary", () => {
  it("不掛書也存得下來", async () => {
    await addVocabulary(userId, "", makeWord({ word: "邂逅" }));

    const [row] = await db.select().from(vocabulary).where(eq(vocabulary.word, "邂逅"));
    expect(row.bookId).toBeNull();
  });

  it("掛了書就記在那本書上", async () => {
    const book = makeBook({ title: "資本論" });
    await addBookRow(userId, book);

    await addVocabulary(userId, book.id, makeWord({ word: "剩餘價值" }));

    const [row] = await db.select().from(vocabulary).where(eq(vocabulary.word, "剩餘價值"));
    expect(row.bookId).not.toBeNull();
  });

  it("空白的字不留列", async () => {
    await addVocabulary(userId, "", makeWord({ word: "   " }));

    const rows = await db.select().from(vocabulary).where(eq(vocabulary.word, "   "));
    expect(rows).toHaveLength(0);
  });
});
