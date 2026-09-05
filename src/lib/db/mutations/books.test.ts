import { eq } from "drizzle-orm";
import { describe, expect, it, vi } from "vitest";
import { books, readings } from "@/lib/db/schema/reading";
import { bookTypes } from "@/lib/db/schema/taxonomy";
import { makeBook } from "@/lib/db/test/factories";

// mutations 從模組層拿 db，換成記憶體裡的那份才測得到
vi.mock("@/lib/db/client", async () => {
  const { makeTestDb } = await import("@/lib/db/test/pglite");
  return { db: await makeTestDb() };
});

const { addBookRow, deleteBookRow, updateBookRow } = await import("./books");
const { db } = await import("@/lib/db/client");

describe("addBookRow", () => {
  it("一次閱讀寫成 books 加 readings 兩列", async () => {
    const book = makeBook();
    await addBookRow(book);

    const reading = await db.select().from(readings).where(eq(readings.id, book.id));
    expect(reading).toHaveLength(1);

    const row = await db.select().from(books).where(eq(books.id, reading[0].bookId));
    expect(row[0].title).toBe("資本論");
  });

  it("沒填日期存得進去——空字串要變成 null，不是丟給 date 欄位", async () => {
    const book = makeBook({ startDate: "", endDate: "" });
    await addBookRow(book);

    const [row] = await db.select().from(readings).where(eq(readings.id, book.id));
    expect(row.startDate).toBeNull();
    expect(row.endDate).toBeNull();
  });

  it("領域與次領域長成父子兩個節點", async () => {
    await addBookRow(makeBook({ domain: "文學", subDomain: "日本文學" }));

    const [parent] = await db.select().from(bookTypes).where(eq(bookTypes.name, "文學"));
    const [child] = await db.select().from(bookTypes).where(eq(bookTypes.name, "日本文學"));
    expect(parent.parentId).toBeNull();
    expect(child.parentId).toBe(parent.id);
  });

  it("originId 指到既有的那次閱讀，就掛在同一本書底下", async () => {
    const first = makeBook({ title: "重讀的書" });
    await addBookRow(first);
    const second = makeBook({ title: "重讀的書", originId: first.id });
    await addBookRow(second);

    const rows = await db.select().from(readings);
    const ids = rows.filter((r) => [first.id, second.id].includes(r.id));
    expect(ids).toHaveLength(2);
    expect(ids[0].bookId).toBe(ids[1].bookId);
  });
});

describe("updateBookRow", () => {
  it("改書名會動到書本身，改日期只動這一次閱讀", async () => {
    const book = makeBook({ title: "舊書名" });
    await addBookRow(book);

    await updateBookRow(book.id, { title: "新書名", endDate: "2026-01-01" });

    const [reading] = await db.select().from(readings).where(eq(readings.id, book.id));
    const [row] = await db.select().from(books).where(eq(books.id, reading.bookId));
    expect(row.title).toBe("新書名");
    expect(reading.endDate).toBe("2026-01-01");
  });

  it("日期清成空字串會存回 null", async () => {
    const book = makeBook({ endDate: "2026-01-01" });
    await addBookRow(book);

    await updateBookRow(book.id, { endDate: "" });

    const [reading] = await db.select().from(readings).where(eq(readings.id, book.id));
    expect(reading.endDate).toBeNull();
  });
});

describe("deleteBookRow", () => {
  it("刪掉最後一次閱讀時，那本書也跟著走，不留空殼", async () => {
    const book = makeBook({ title: "只讀過一次" });
    await addBookRow(book);
    const [reading] = await db.select().from(readings).where(eq(readings.id, book.id));

    await deleteBookRow(book.id);

    expect(await db.select().from(readings).where(eq(readings.id, book.id))).toHaveLength(0);
    expect(await db.select().from(books).where(eq(books.id, reading.bookId))).toHaveLength(0);
  });
});

describe("交易", () => {
  it("中途失敗不留半套資料", async () => {
    const { books: booksTable } = await import("@/lib/db/schema/reading");
    const before = (await db.select().from(booksTable)).length;

    await expect(
      db.transaction(async (tx) => {
        await tx.insert(booksTable).values({ title: "會被回滾的書", author: "", language: "" });
        throw new Error("故意失敗");
      }),
    ).rejects.toThrow("故意失敗");

    expect(await db.select().from(booksTable)).toHaveLength(before);
  });
});
