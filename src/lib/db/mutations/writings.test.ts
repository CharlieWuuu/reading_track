import { eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import { kinds } from "@/lib/db/schema/kinds";
import { writingTopics } from "@/lib/db/schema/taxonomy";
import { writings } from "@/lib/db/schema/writings";
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
    createdAt: "2026-01-01T00:00:00.000Z",
    date: "2026-03-03",
    title: "一則書寫",
    topic: "",
    keywords: "",
    note: "內容",
    link: "",
    sourceTitle: "",
    sourceKind: "",
    kindId: "",
    kindName: "書寫",
    kindSlug: "writing",
    sourceId: "",
    private: "",
    coverUrl: "",
    ...patch,
  };
}

describe("addWritingRow", () => {
  /** 書寫不分類型：每一則都掛在「書寫」這個類型上，分類交給主題與關鍵字 */
  it("一律掛在書寫這個類型上，不長出別的類型", async () => {
    const writing = makeWriting();
    await addWritingRow(userId, writing);

    const [row] = await db.select().from(writings).where(eq(writings.id, writing.id));
    const [kind] = await db.select().from(kinds).where(eq(kinds.id, row.kindId));
    expect(kind.name).toBe("書寫");

    const all = await db.select().from(kinds).where(eq(kinds.groupKey, "writings"));
    expect(all).toHaveLength(1);
  });

  it("主題寫入 writing_topics，同名不重複建立", async () => {
    const first = makeWriting({ topic: "思緒" });
    await addWritingRow(userId, first);
    const second = makeWriting({ topic: "思緒" });
    await addWritingRow(userId, second);

    const rows = await db.select().from(writings).where(eq(writings.id, first.id));
    const [row] = rows;
    const topics = await db.select().from(writingTopics).where(eq(writingTopics.name, "思緒"));
    expect(topics).toHaveLength(1);
    expect(row.topicId).toBe(topics[0].id);

    const [row2] = await db.select().from(writings).where(eq(writings.id, second.id));
    expect(row2.topicId).toBe(topics[0].id);
  });

  it("sourceId 指到某一次閱讀時，掛回它屬於的那個作品", async () => {
    const reading = crypto.randomUUID();
    await addBookRow(userId, makeBook({ id: reading, title: "來源書" }));

    const writing = makeWriting({ sourceId: reading });
    await addWritingRow(userId, writing);

    const [row] = await db.select().from(writings).where(eq(writings.id, writing.id));
    expect(row.workId).toBeTruthy();
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
