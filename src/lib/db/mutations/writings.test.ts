import { eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import { kinds } from "@/lib/db/schema/kinds";
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
    kindName: "心得",
    kindCountUnit: "",
    kindSlug: "reflection",
    sourceId: "",
    private: "",
    coverUrl: "",
    ...patch,
  };
}

describe("addWritingRow", () => {
  /** 分類是第三層類型，不是主題——舊形狀的 topic 欄帶的就是類型名字 */
  it("照名字掛到對應的類型上", async () => {
    const writing = makeWriting({ topic: "思緒" });
    await addWritingRow(userId, writing);

    const [row] = await db.select().from(writings).where(eq(writings.id, writing.id));
    const [kind] = await db.select().from(kinds).where(eq(kinds.id, row.kindId));
    expect(kind.name).toBe("思緒");
    expect(row.topicId).toBeNull(); // 主題那層不再參與分類
  });

  it("沒給類型就當心得", async () => {
    const writing = makeWriting({ topic: "" });
    await addWritingRow(userId, writing);

    const [row] = await db.select().from(writings).where(eq(writings.id, writing.id));
    const [kind] = await db.select().from(kinds).where(eq(kinds.id, row.kindId));
    expect(kind.name).toBe("心得");
  });

  it("書寫底下沒有這個類型就丟錯，不默默寫錯的進去", async () => {
    await expect(addWritingRow(userId, makeWriting({ topic: "不存在的類型" }))).rejects.toThrow(
      "不存在的類型",
    );
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
