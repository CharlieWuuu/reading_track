import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { bookKeywords, writingKeywords } from "@/lib/db/schema/keyword-links";
import { books, readings } from "@/lib/db/schema/reading";
import { quotes, vocabulary } from "@/lib/db/schema/records";
import { attributes, bookTypes, keywords, writingTypes } from "@/lib/db/schema/taxonomy";
import { users } from "@/lib/db/schema/users";
import { metrics, writings } from "@/lib/db/schema/writing";

/**
 * demo 帳號的假資料。書名作者是真的，日期、心得、關鍵字都是編的。
 *
 * 先清掉那個帳號名下的所有資料再重灌——跑幾次結果都一樣，
 * 所以定時重置直接呼叫這一支就好。
 */

const TYPES: Record<string, string[]> = {
  文學: ["小說", "散文"],
  人文社科: ["哲學", "社會學", "心理學"],
  商業: ["理財", "個人成長"],
};

const ATTRIBUTES = ["小說", "論述", "散文"];

/** Open Library 2026-09 月度熱門榜，換成中文版書名與出版社 */
const BOOKS = [
  ["原子習慣", "James Clear", "方智", "商業", "個人成長", "論述", ["習慣", "行為改變"]],
  ["權力的 48 條法則", "Robert Greene", "商周", "人文社科", "社會學", "論述", ["權力", "格林"]],
  ["富爸爸，窮爸爸", "Robert Kiyosaki", "高寶", "商業", "理財", "論述", ["理財"]],
  ["致富心態", "Morgan Housel", "天下文化", "商業", "理財", "論述", ["理財", "行為經濟學"]],
  ["哈利波特：神秘的魔法石", "J. K. Rowling", "皇冠", "文學", "小說", "小說", ["奇幻", "羅琳"]],
  ["卡內基溝通與人際關係", "Dale Carnegie", "龍齡", "商業", "個人成長", "論述", ["溝通"]],
  ["傲慢與偏見", "Jane Austen", "商周", "文學", "小說", "小說", ["奧斯汀", "英國文學"]],
  ["牧羊少年奇幻之旅", "Paulo Coelho", "時報出版", "文學", "小說", "小說", ["寓言"]],
  ["管他的：愈在意愈不開心", "Mark Manson", "平安文化", "商業", "個人成長", "論述", ["斯多噶"]],
  ["思考致富", "Napoleon Hill", "久石文化", "商業", "理財", "論述", ["理財"]],
  ["1984", "George Orwell", "遠流", "文學", "小說", "小說", ["歐威爾", "極權"]],
  ["與成功有約", "Stephen R. Covey", "天下文化", "商業", "個人成長", "論述", ["習慣"]],
  ["人性 18 法則", "Robert Greene", "李茲文化", "人文社科", "心理學", "論述", ["格林", "人性"]],
  [
    "快思慢想",
    "Daniel Kahneman",
    "天下文化",
    "人文社科",
    "心理學",
    "論述",
    ["行為經濟學", "康納曼"],
  ],
  ["飢餓遊戲", "Suzanne Collins", "大塊文化", "文學", "小說", "小說", ["反烏托邦"]],
  ["小王子", "Antoine de Saint-Exupéry", "漫遊者文化", "文學", "小說", "小說", ["寓言"]],
  ["動物農莊", "George Orwell", "遠流", "文學", "小說", "小說", ["歐威爾", "極權"]],
  ["變形記", "Franz Kafka", "麥田", "文學", "小說", "小說", ["卡夫卡", "存在主義"]],
  ["潛意識的力量", "Joseph Murphy", "柿子文化", "人文社科", "心理學", "論述", ["潛意識"]],
  ["咆哮山莊", "Emily Brontë", "遠流", "文學", "小說", "小說", ["英國文學"]],
  ["誘惑的藝術", "Robert Greene", "商周", "人文社科", "社會學", "論述", ["格林", "權力"]],
  ["君主論", "Niccolò Machiavelli", "五南", "人文社科", "哲學", "論述", ["馬基維利", "權力"]],
  ["冰與火之歌：權力遊戲", "George R. R. Martin", "高寶", "文學", "小說", "小說", ["奇幻"]],
  ["活出意義來", "Viktor E. Frankl", "光啟文化", "人文社科", "哲學", "論述", ["意義", "存在主義"]],
  ["遜咖日記", "Jeff Kinney", "未來出版", "文學", "小說", "小說", []],
  ["異鄉人", "Albert Camus", "麥田", "文學", "小說", "小說", ["卡繆", "存在主義"]],
  ["波西傑克森：神火之賊", "Rick Riordan", "遠流", "文學", "小說", "小說", ["奇幻", "神話"]],
] as const;

const WRITINGS = [
  ["讀《原子習慣》：複利是怎麼發生的", "書籍", 0, "讀後感", ["習慣", "行為改變"]],
  ["理財書為什麼都在講心態", "隨筆", null, "隨筆", ["理財"]],
  ["重讀 1984 的第三次", "書籍", 10, "讀後感", ["歐威爾", "極權"]],
  ["存在主義是一種心情嗎", "隨筆", null, "隨筆", ["存在主義", "卡繆"]],
  ["《快思慢想》的兩個系統，我用了三年才懂", "書籍", 13, "讀後感", ["行為經濟學", "康納曼"]],
  ["格林的三本書讀下來", "書籍", 1, "讀後感", ["格林", "權力"]],
  ["《活出意義來》與集中營裡的選擇", "書籍", 23, "讀後感", ["意義"]],
  ["卡夫卡的早晨", "書籍", 17, "讀後感", ["卡夫卡"]],
  ["奇幻小說是逃避嗎", "隨筆", null, "隨筆", ["奇幻"]],
  ["一年讀了幾本書這件事", "隨筆", null, "隨筆", []],
] as const;

const QUOTES = [
  [0, "你不會升到目標的高度，你會掉到系統的水準。", "第一章"],
  [3, "財富是你沒有花掉的錢。", "第十章"],
  [10, "誰控制過去，誰就控制未來。", "第一部"],
  [13, "我們對自己的無知一無所知。", "第一部"],
  [15, "真正重要的東西，用眼睛是看不見的。", "第二十一章"],
  [17, "一天早晨，葛雷戈爾從不安的睡夢中醒來，發現自己躺在床上變成了一隻巨大的蟲。", "開篇"],
  [23, "人所擁有的任何東西，都可以被剝奪，唯獨人性最後的自由不能。", "第一部"],
  [25, "今天，媽媽死了。也許是昨天，我不知道。", "開篇"],
] as const;

const VOCABULARY = [
  [
    0,
    "compound",
    "ˈkɑmpaʊnd",
    "複利、累積",
    "Habits are the compound interest of self-improvement.",
    "習慣是自我成長的複利",
    "英文",
  ],
  [3, "wealth", "wɛlθ", "財富", "Wealth is what you don't see.", "財富是你看不見的部分", "英文"],
  [
    10,
    "doublethink",
    "ˈdʌblθɪŋk",
    "雙重思想",
    "Doublethink means holding two contradictory beliefs.",
    "雙重思想是同時抱持兩種矛盾的信念",
    "英文",
  ],
  [
    13,
    "heuristic",
    "hjʊˈrɪstɪk",
    "捷思",
    "We rely on heuristics under uncertainty.",
    "不確定時我們依賴捷思",
    "英文",
  ],
  [
    23,
    "meaning",
    "ˈminɪŋ",
    "意義",
    "Those who have a why can bear almost any how.",
    "知道為何而活的人，幾乎能忍受任何處境",
    "英文",
  ],
  [
    25,
    "absurd",
    "əbˈsɜrd",
    "荒謬",
    "The absurd is born of this confrontation.",
    "荒謬誕生於這樣的對峙",
    "英文",
  ],
] as const;

function daysAgo(n: number): string {
  const d = new Date(Date.now() - n * 86400000);
  return d.toISOString().slice(0, 10);
}

export async function seedDemo(email: string): Promise<string> {
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (!user) throw new Error(`找不到 ${email}，先用 scripts/create-user.ts 建帳號`);
  const userId = user.id;

  // 重跑要一致，先清掉這個帳號名下的東西（外鍵 cascade 會帶走關聯與子表）
  for (const table of [writings, books, keywords, bookTypes, writingTypes, attributes]) {
    await db.delete(table).where(eq(table.userId, userId));
  }

  const typeId = new Map<string, string>();
  for (const [parent, children] of Object.entries(TYPES)) {
    const [row] = await db
      .insert(bookTypes)
      .values({ userId, name: parent })
      .returning({ id: bookTypes.id });
    typeId.set(parent, row.id);
    for (const child of children) {
      const [c] = await db
        .insert(bookTypes)
        .values({ userId, name: child, parentId: row.id })
        .returning({ id: bookTypes.id });
      typeId.set(`${parent}/${child}`, c.id);
    }
  }

  const attributeId = new Map<string, string>();
  for (const name of ATTRIBUTES) {
    const [row] = await db
      .insert(attributes)
      .values({ userId, name })
      .returning({ id: attributes.id });
    attributeId.set(name, row.id);
  }

  const allKeywords = new Set(BOOKS.flatMap((b) => b[6] as readonly string[]));
  for (const w of WRITINGS) for (const k of w[4] as readonly string[]) allKeywords.add(k);
  if (allKeywords.size)
    await db.insert(keywords).values([...allKeywords].map((name) => ({ userId, name })));

  const bookIds: string[] = [];
  const readingIds: string[] = [];

  for (const [i, entry] of BOOKS.entries()) {
    const [title, author, publisher, domain, subDomain, attribute, names] = entry;
    const [book] = await db
      .insert(books)
      .values({
        userId,
        title,
        author,
        language: "中文",
        typeId: typeId.get(subDomain ? `${domain}/${subDomain}` : domain) ?? null,
        attributeId: attributeId.get(attribute) ?? null,
      })
      .returning({ id: books.id });
    bookIds.push(book.id);

    // 前面幾本讀完、中間在讀、最後幾本想讀
    const status = i < 18 ? "已讀完" : i < 23 ? "閱讀中" : "想讀";
    const [reading] = await db
      .insert(readings)
      .values({
        userId,
        bookId: book.id,
        status,
        startDate: status === "想讀" ? null : daysAgo(400 - i * 12),
        endDate: status === "已讀完" ? daysAgo(380 - i * 12) : null,
        publisher,
        platform: i % 3 === 0 ? "讀墨" : i % 3 === 1 ? "實體書" : "Kobo",
        pageCount: 200 + ((i * 37) % 300),
      })
      .returning({ id: readings.id });
    readingIds.push(reading.id);

    if (names.length)
      await db
        .insert(bookKeywords)
        .values(names.map((keyword) => ({ userId, bookId: book.id, keyword })));
  }

  // 兩本重讀：同一本書底下再加一次閱讀
  for (const i of [10, 25]) {
    await db.insert(readings).values({
      userId,
      bookId: bookIds[i],
      status: "已讀完",
      startDate: daysAgo(90),
      endDate: daysAgo(60),
      publisher: BOOKS[i][2],
      platform: "實體書",
    });
  }

  const writingTypeId = new Map<string, string>();
  for (const name of ["讀後感", "隨筆"]) {
    const [row] = await db
      .insert(writingTypes)
      .values({ userId, name })
      .returning({ id: writingTypes.id });
    writingTypeId.set(name, row.id);
  }

  for (const [i, entry] of WRITINGS.entries()) {
    const [title, , bookIndex, kind, names] = entry;
    const [writing] = await db
      .insert(writings)
      .values({
        userId,
        title,
        bookId: bookIndex === null ? null : bookIds[bookIndex],
        typeId: bookIndex === null ? (writingTypeId.get(kind) ?? null) : null,
        note: "（demo 資料）這裡是心得內文。",
        date: daysAgo(300 - i * 25),
      })
      .returning({ id: writings.id });

    if (names.length)
      await db
        .insert(writingKeywords)
        .values(names.map((keyword) => ({ userId, writingId: writing.id, keyword })));

    if (i % 3 === 0)
      await db.insert(metrics).values({
        userId,
        writingId: writing.id,
        date: daysAgo(280 - i * 25),
        platform: "Medium",
        views: 300 + i * 120,
        reads: 100 + i * 40,
      });
  }

  await db.insert(quotes).values(
    QUOTES.map(([bookIndex, text, chapter]) => ({
      userId,
      bookId: bookIds[bookIndex],
      text,
      chapter,
    })),
  );

  await db.insert(vocabulary).values(
    VOCABULARY.map(
      ([
        bookIndex,
        word,
        pronunciation,
        wordTranslation,
        sentence,
        sentenceTranslation,
        language,
      ]) => ({
        userId,
        bookId: bookIds[bookIndex],
        word,
        pronunciation,
        wordTranslation,
        sentence,
        sentenceTranslation,
        language,
      }),
    ),
  );

  return (
    `${email}：${BOOKS.length} 本書、${readingIds.length + 2} 次閱讀、${WRITINGS.length} 則書寫、` +
    `${QUOTES.length} 句佳句、${VOCABULARY.length} 個單字、${allKeywords.size} 個關鍵字`
  );
}
