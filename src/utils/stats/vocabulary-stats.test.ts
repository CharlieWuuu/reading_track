import { describe, expect, it } from "vitest";
import { makeBook, makeQuote, makeVocabulary, resetIds } from "@/testing/factories";
import {
  filterVocabularyByLanguage,
  getNoteRecords,
  getQuoteRecords,
  getVocabularyEntries,
  vocabularyLanguages,
} from "./vocabulary-stats";

resetIds();

describe("getVocabularyEntries", () => {
  it("同一個詞在不同書裡是兩次相遇", () => {
    const rows = [
      makeVocabulary({ word: "serendipity", bookId: "b1" }),
      makeVocabulary({ word: "serendipity", bookId: "b2" }),
    ];

    const entries = getVocabularyEntries(rows, []);

    expect(entries).toHaveLength(1);
    expect(entries[0].encounters).toHaveLength(2);
  });

  it("相遇多的排前面，一樣多就照字排", () => {
    const rows = [
      makeVocabulary({ word: "beta" }),
      makeVocabulary({ word: "alpha" }),
      makeVocabulary({ word: "gamma" }),
      makeVocabulary({ word: "gamma" }),
    ];

    expect(getVocabularyEntries(rows, []).map((e) => e.word)).toEqual(["gamma", "alpha", "beta"]);
  });

  it("書名與封面以書籍表為準", () => {
    const book = makeBook({ id: "b1", title: "改過的書名", coverUrl: "https://example.com/c.jpg" });
    const rows = [makeVocabulary({ bookId: "b1", bookTitle: "舊書名" })];

    const [encounter] = getVocabularyEntries(rows, [book])[0].encounters;

    expect(encounter.bookTitle).toBe("改過的書名");
    expect(encounter.bookCover).toBe("https://example.com/c.jpg");
  });

  it("找不到書就沿用紀錄上的書名，封面留空", () => {
    const rows = [makeVocabulary({ bookId: "沒有這本", bookTitle: "快照書名" })];

    const [encounter] = getVocabularyEntries(rows, [])[0].encounters;

    expect(encounter.bookTitle).toBe("快照書名");
    expect(encounter.bookCover).toBe("");
  });

  it("沒填語言就跟著書走", () => {
    const book = makeBook({ id: "b1", language: "英文" });
    const rows = [makeVocabulary({ bookId: "b1", language: "" })];

    expect(getVocabularyEntries(rows, [book])[0].encounters[0].language).toBe("英文");
  });

  it("有填語言就用自己的", () => {
    const book = makeBook({ id: "b1", language: "英文" });
    const rows = [makeVocabulary({ bookId: "b1", language: "日文" })];

    expect(getVocabularyEntries(rows, [book])[0].encounters[0].language).toBe("日文");
  });
});

describe("getQuoteRecords", () => {
  it("補上封面、書名用活的那一份", () => {
    const book = makeBook({ id: "b1", title: "改過的書名", coverUrl: "cover.jpg" });
    const rows = [makeQuote({ bookId: "b1", bookTitle: "舊書名" })];

    expect(getQuoteRecords(rows, [book])).toEqual([
      { ...rows[0], bookTitle: "改過的書名", bookCover: "cover.jpg" },
    ]);
  });

  it("順序照原本的，不重排", () => {
    const rows = [makeQuote({ text: "第一句" }), makeQuote({ text: "第二句" })];

    expect(getQuoteRecords(rows, []).map((r) => r.text)).toEqual(["第一句", "第二句"]);
  });
});

describe("getNoteRecords", () => {
  it("沒寫心得的不列", () => {
    const books = [makeBook({ note: "有寫" }), makeBook({ note: "" }), makeBook({ note: "   " })];

    expect(getNoteRecords(books)).toHaveLength(1);
  });

  it("帶著書名與封面", () => {
    const book = makeBook({ note: "有寫", title: "書名", coverUrl: "cover.jpg" });

    expect(getNoteRecords([book])[0]).toEqual({
      note: "有寫",
      bookId: book.id,
      bookTitle: "書名",
      bookCover: "cover.jpg",
    });
  });
});

describe("語言篩選", () => {
  const rows = [
    makeVocabulary({ word: "ephemeral", bookId: "b1", language: "英文" }),
    makeVocabulary({ word: "刹那", bookId: "b2", language: "" }),
  ];
  const books = [
    makeBook({ id: "b1", language: "英文" }),
    makeBook({ id: "b2", language: "日文" }),
  ];

  it("沒填語言的跟著書走，選項只列真的有在用的", () => {
    expect(vocabularyLanguages(getVocabularyEntries(rows, books))).toEqual(["日文", "英文"]);
  });

  it("空字串是全部", () => {
    const entries = getVocabularyEntries(rows, books);
    expect(filterVocabularyByLanguage(entries, "")).toHaveLength(2);
    expect(filterVocabularyByLanguage(entries, "日文").map((e) => e.word)).toEqual(["刹那"]);
  });
});
