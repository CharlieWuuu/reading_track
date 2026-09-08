import { eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import { topics } from "@/lib/db/schema/taxonomy";
import { records, works } from "@/lib/db/schema/works";
import { makeBook, seedUser } from "@/lib/db/test/factories";
import { kindIdByName } from "./kind-lookup";

// mutations 從模組層拿 db，換成記憶體裡的那份才測得到
vi.mock("@/lib/db/client", async () => {
  const { makeTestDb } = await import("@/lib/db/test/pglite");
  return { db: await makeTestDb() };
});

const { addBookRow, deleteBookRow, updateBookRow } = await import("./books");
const { db } = await import("@/lib/db/client");
const userId = await seedUser(db);

describe("addBookRow", () => {
  it("一次閱讀寫成 works 加 records 兩列", async () => {
    const book = makeBook();
    await addBookRow(userId, book);

    const reading = await db.select().from(records).where(eq(records.id, book.id));
    expect(reading).toHaveLength(1);

    const row = await db.select().from(works).where(eq(works.id, reading[0].workId));
    expect(row[0].title).toBe("資本論");
  });

  it("沒填日期存得進去——空字串要變成 null，不是丟給 date 欄位", async () => {
    const book = makeBook({ startDate: "", endDate: "" });
    await addBookRow(userId, book);

    const [row] = await db.select().from(records).where(eq(records.id, book.id));
    expect(row.startDate).toBeNull();
    expect(row.endDate).toBeNull();
  });

  it("領域與次領域長成父子兩個節點", async () => {
    await addBookRow(userId, makeBook({ domain: "文學", subDomain: "日本文學" }));

    const [parent] = await db.select().from(topics).where(eq(topics.name, "文學"));
    const [child] = await db.select().from(topics).where(eq(topics.name, "日本文學"));
    expect(parent.parentId).toBeNull();
    expect(child.parentId).toBe(parent.id);
  });

  it("originId 指到既有的那次閱讀，就掛在同一個作品底下", async () => {
    const first = makeBook({ title: "重讀的書" });
    await addBookRow(userId, first);
    const second = makeBook({ title: "重讀的書", originId: first.id });
    await addBookRow(userId, second);

    const rows = await db.select().from(records);
    const ids = rows.filter((r) => [first.id, second.id].includes(r.id));
    expect(ids).toHaveLength(2);
    expect(ids[0].workId).toBe(ids[1].workId);
  });
});

describe("updateBookRow", () => {
  it("改書名會動到書本身，改日期只動這一次閱讀", async () => {
    const book = makeBook({ title: "舊書名" });
    await addBookRow(userId, book);

    await updateBookRow(userId, book.id, { title: "新書名", endDate: "2026-01-01" });

    const [reading] = await db.select().from(records).where(eq(records.id, book.id));
    const [row] = await db.select().from(works).where(eq(works.id, reading.workId));
    expect(row.title).toBe("新書名");
    expect(reading.endDate).toBe("2026-01-01");
  });

  it("日期清成空字串會存回 null", async () => {
    const book = makeBook({ endDate: "2026-01-01" });
    await addBookRow(userId, book);

    await updateBookRow(userId, book.id, { endDate: "" });

    const [reading] = await db.select().from(records).where(eq(records.id, book.id));
    expect(reading.endDate).toBeNull();
  });
});

describe("deleteBookRow", () => {
  it("刪掉最後一次紀錄時，那個作品也跟著走，不留空殼", async () => {
    const book = makeBook({ title: "只讀過一次" });
    await addBookRow(userId, book);
    const [reading] = await db.select().from(records).where(eq(records.id, book.id));

    await deleteBookRow(userId, book.id);

    expect(await db.select().from(records).where(eq(records.id, book.id))).toHaveLength(0);
    expect(await db.select().from(works).where(eq(works.id, reading.workId))).toHaveLength(0);
  });
});

describe("交易", () => {
  it("中途失敗不留半套資料", async () => {
    const before = (await db.select().from(works)).length;

    await expect(
      db.transaction(async (tx) => {
        await tx.insert(works).values({
          userId,
          kindId: await kindIdByName(tx, userId, "書籍"),
          title: "會被回滾的書",
          creator: "",
          language: "",
        });
        throw new Error("故意失敗");
      }),
    ).rejects.toThrow("故意失敗");

    expect(await db.select().from(works)).toHaveLength(before);
  });
});
