import { eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import { writingTypes } from "@/lib/db/schema/taxonomy";
import { writings } from "@/lib/db/schema/writing";
import { makeBook, seedUser } from "@/lib/db/test/factories";
import type { Writing } from "@/types/writing";

vi.mock("@/lib/db/client", async () => {
  const { makeTestDb } = await import("@/lib/db/test/pglite");
  return { db: await makeTestDb() };
});

const { addWritingRow, updateWritingRow } = await import("./writings");
const { addBookRow } = await import("./books");
const { db } = await import("@/lib/db/client");
const userId = await seedUser(db);

function makeWriting(patch: Partial<Writing> = {}): Writing {
  return {
    id: crypto.randomUUID(),
    date: "2026-03-03",
    title: "一則書寫",
    kind: "反思",
    keywords: "",
    note: "內容",
    link: "",
    sourceTitle: "",
    sourceId: "",
    private: "",
    ...patch,
  };
}

describe("addWritingRow", () => {
  it("類型沒有就長一個出來", async () => {
    await addWritingRow(userId, makeWriting({ kind: "週計劃" }));

    const rows = await db.select().from(writingTypes).where(eq(writingTypes.name, "週計劃"));
    expect(rows).toHaveLength(1);
  });

  it("「書籍」「文章」不是類型，是在說它有出處——不該長成一個類型", async () => {
    await addWritingRow(userId, makeWriting({ kind: "書籍" }));

    const rows = await db.select().from(writingTypes).where(eq(writingTypes.name, "書籍"));
    expect(rows).toHaveLength(0);
  });

  it("sourceId 指到某一次閱讀時，掛回它屬於的那本書", async () => {
    const reading = crypto.randomUUID();
    await addBookRow(userId, makeBook({ id: reading, title: "來源書" }));

    const writing = makeWriting({ sourceId: reading });
    await addWritingRow(userId, writing);

    const [row] = await db.select().from(writings).where(eq(writings.id, writing.id));
    expect(row.bookId).toBeTruthy();
    expect(row.articleId).toBeNull();
  });
});

describe("updateWritingRow", () => {
  it("日期清空存回 null", async () => {
    const writing = makeWriting();
    await addWritingRow(userId, writing);

    await updateWritingRow(userId, writing.id, { date: "" });

    const [row] = await db.select().from(writings).where(eq(writings.id, writing.id));
    expect(row.date).toBeNull();
  });
});
