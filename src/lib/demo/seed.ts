import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { seedKinds } from "@/lib/db/mutations/kinds";
import { fragments } from "@/lib/db/schema/fragments";
import { mapBookKeyword, mapWritingKeyword } from "@/lib/db/schema/keyword-links";
import { kinds, kindStatuses } from "@/lib/db/schema/kinds";
import { bookAttributes, bookTypes, keywords } from "@/lib/db/schema/taxonomy";
import { users } from "@/lib/db/schema/users";
import { records, works } from "@/lib/db/schema/works";
import { writings } from "@/lib/db/schema/writings";

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
  ["牧羊少年奇幻之旅", "Paulo Coelho", "時報出版", "文學", "小說", "小說", ["寓言"]],
  ["管他的：愈在意愈不開心", "Mark Manson", "平安文化", "商業", "個人成長", "論述", ["斯多噶"]],
  ["思考致富", "Napoleon Hill", "久石文化", "商業", "理財", "論述", ["理財"]],
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
  ["君主論", "Niccolò Machiavelli", "五南", "人文社科", "哲學", "論述", ["馬基維利", "權力"]],
  ["冰與火之歌：權力遊戲", "George R. R. Martin", "高寶", "文學", "小說", "小說", ["奇幻"]],
  ["活出意義來", "Viktor E. Frankl", "光啟文化", "人文社科", "哲學", "論述", ["意義", "存在主義"]],
  ["異鄉人", "Albert Camus", "麥田", "文學", "小說", "小說", ["卡繆", "存在主義"]],
  ["波西傑克森：神火之賊", "Rick Riordan", "遠流", "文學", "小說", "小說", ["奇幻", "神話"]],
  [
    "Rewire 神經可塑性：用神經科學突破行為模式",
    "Nicole Vignola",
    "天下雜誌",
    "人文社科",
    "心理學",
    "論述",
    ["神經科學", "行為改變"],
  ],
  [
    "解憂雜貨店【50 萬冊紀念愛藏版】",
    "東野圭吾",
    "皇冠",
    "文學",
    "小說",
    "小說",
    ["日本文學", "東野圭吾"],
  ],
  ["那瓦爾寶典", "Eric Jorgenson", "天下雜誌", "商業", "個人成長", "論述", ["理財", "財富自由"]],
  [
    "被討厭的勇氣：自我啟發之父「阿德勒」的教導",
    "岸見一郎、古賀史健",
    "究竟",
    "人文社科",
    "心理學",
    "論述",
    ["阿德勒", "人性"],
  ],
  [
    "微實驗：透過微小的嘗試，探索人生的無限可能",
    "Anne-Laure Le Cunff",
    "天下雜誌",
    "商業",
    "個人成長",
    "論述",
    ["行為改變", "實驗"],
  ],
] as const;

const WRITINGS = [
  ["讀《原子習慣》：複利是怎麼發生的", "書籍", 0, "讀後感", ["習慣", "行為改變"]],
  ["理財書為什麼都在講心態", "隨筆", null, "隨筆", ["理財"]],
  ["存在主義是一種心情嗎", "隨筆", null, "隨筆", ["存在主義", "卡繆"]],
  ["《快思慢想》的兩個系統，我用了三年才懂", "書籍", 9, "讀後感", ["行為經濟學", "康納曼"]],
  ["格林的三本書讀下來", "書籍", 1, "讀後感", ["格林", "權力"]],
  ["《活出意義來》與集中營裡的選擇", "書籍", 18, "讀後感", ["意義"]],
  ["卡夫卡的早晨", "書籍", 13, "讀後感", ["卡夫卡"]],
  ["奇幻小說是逃避嗎", "隨筆", null, "隨筆", ["奇幻"]],
  ["一年讀了幾本書這件事", "隨筆", null, "隨筆", []],
] as const;

const NOTES: Record<string, string> = {
  "讀《原子習慣》：複利是怎麼發生的": "一天 1% 聽起來像雞湯，真正有用的是它把焦點從目標挪到系統。",
  理財書為什麼都在講心態: "翻了幾本，工具講得都差不多，差別全在能不能忍住不動。",
  存在主義是一種心情嗎: "讀卡繆的時候常懷疑，我讀到的是哲學還是某種天氣。",
  "《快思慢想》的兩個系統，我用了三年才懂":
    "系統一不是笨，是快。知道它快，才知道什麼時候該踩煞車。",
  格林的三本書讀下來: "權力、誘惑、人性，三本其實在講同一件事：看清楚別人在玩什麼。",
  "《活出意義來》與集中營裡的選擇": "最後的自由是選擇態度——這句話放在那個處境裡才有重量。",
  卡夫卡的早晨: "變成蟲不是恐怖的部分，家人開始討論怎麼辦才是。",
  奇幻小說是逃避嗎: "逃避也需要地圖。奇幻給的是另一套規則，不是沒有規則。",
  一年讀了幾本書這件事: "數字好記，但記不住的是哪一本改變了什麼。",
};

const QUOTES = [
  [0, "你不會升到目標的高度，你會掉到系統的水準。", "第一章"],
  [3, "財富是你沒有花掉的錢。", "第十章"],
  [9, "我們對自己的無知一無所知。", "第一部"],
  [11, "真正重要的東西，用眼睛是看不見的。", "第二十一章"],
  [13, "一天早晨，葛雷戈爾從不安的睡夢中醒來，發現自己躺在床上變成了一隻巨大的蟲。", "開篇"],
  [18, "人所擁有的任何東西，都可以被剝奪，唯獨人性最後的自由不能。", "第一部"],
  [19, "今天，媽媽死了。也許是昨天，我不知道。", "開篇"],
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
    9,
    "heuristic",
    "hjʊˈrɪstɪk",
    "捷思",
    "We rely on heuristics under uncertainty.",
    "不確定時我們依賴捷思",
    "英文",
  ],
  [
    18,
    "meaning",
    "ˈminɪŋ",
    "意義",
    "Those who have a why can bear almost any how.",
    "知道為何而活的人，幾乎能忍受任何處境",
    "英文",
  ],
  [
    19,
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
  for (const table of [fragments, writings, works, keywords, bookTypes, bookAttributes, kinds]) {
    await db.delete(table).where(eq(table.userId, userId));
  }
  await seedKinds(userId); // 類型是資料，demo 帳號也要有

  const kindId = async (name: string) =>
    (
      await db
        .select({ id: kinds.id })
        .from(kinds)
        .where(and(eq(kinds.userId, userId), eq(kinds.name, name)))
    )[0].id;

  const statusId = async (kind: string, label: string) =>
    (
      await db
        .select({ id: kindStatuses.id, label: kindStatuses.label })
        .from(kindStatuses)
        .where(eq(kindStatuses.kindId, await kindId(kind)))
    ).find((row) => row.label === label)!.id;

  const bookKindId = await kindId("書籍");
  const statusIds = {
    已讀完: await statusId("書籍", "已讀完"),
    閱讀中: await statusId("書籍", "閱讀中"),
    想讀: await statusId("書籍", "想讀"),
  };
  const quoteKindId = await kindId("佳句");
  const vocabularyKindId = await kindId("單字");
  const keywordKindId = await kindId("關鍵字");

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
      .insert(bookAttributes)
      .values({ userId, name })
      .returning({ id: bookAttributes.id });
    attributeId.set(name, row.id);
  }

  const allKeywords = new Set(BOOKS.flatMap((b) => b[6] as readonly string[]));
  for (const w of WRITINGS) for (const k of w[4] as readonly string[]) allKeywords.add(k);
  if (allKeywords.size) {
    // 兩邊都要：主檔給關聯表的外鍵用，片段才是關鍵字本身
    await db.insert(keywords).values([...allKeywords].map((name) => ({ userId, name })));
    await db
      .insert(fragments)
      .values([...allKeywords].map((name) => ({ userId, kindId: keywordKindId, name })));
  }

  const bookIds: string[] = [];
  const readingIds: string[] = [];

  for (const [i, entry] of BOOKS.entries()) {
    const [title, author, publisher, domain, subDomain, attribute, names] = entry;
    const [book] = await db
      .insert(works)
      .values({
        userId,
        kindId: bookKindId,
        title,
        creator: author,
        language: "中文",
        source: publisher,
        topicId: typeId.get(subDomain ? `${domain}/${subDomain}` : domain) ?? null,
        attributeId: attributeId.get(attribute) ?? null,
      })
      .returning({ id: works.id });
    bookIds.push(book.id);

    // 前面幾本讀完、中間在讀、最後幾本想讀
    const status = i < 17 ? "已讀完" : i < 22 ? "閱讀中" : "想讀";
    const [reading] = await db
      .insert(records)
      .values({
        userId,
        workId: book.id,
        statusId: statusIds[status],
        startDate: status === "想讀" ? null : daysAgo(400 - i * 12),
        endDate: status === "已讀完" ? daysAgo(380 - i * 12) : null,
        amount: 200 + ((i * 37) % 300),
      })
      .returning({ id: records.id });
    readingIds.push(reading.id);

    if (names.length)
      await db
        .insert(mapBookKeyword)
        .values(names.map((keyword) => ({ userId, bookId: book.id, keyword })));
  }

  // 兩本重讀：同一個作品底下再加一次紀錄
  for (const i of [13, 19]) {
    await db.insert(records).values({
      userId,
      workId: bookIds[i],
      statusId: statusIds["已讀完"],
      startDate: daysAgo(90),
      endDate: daysAgo(60),
    });
  }

  // 掛了出處的是心得，沒掛的是日記——這正是專欄那一堆的分法
  const reflectionKindId = await kindId("心得");
  const diaryKindId = await kindId("日記");

  for (const [i, entry] of WRITINGS.entries()) {
    const [title, , bookIndex, , names] = entry;
    const [writing] = await db
      .insert(writings)
      .values({
        userId,
        kindId: bookIndex === null ? diaryKindId : reflectionKindId,
        workId: bookIndex === null ? null : bookIds[bookIndex],
        name: title,
        body: NOTES[title] ?? "",
        date: daysAgo(300 - i * 25),
      })
      .returning({ id: writings.id });

    if (names.length)
      await db
        .insert(mapWritingKeyword)
        .values(names.map((keyword) => ({ userId, writingId: writing.id, keyword })));
  }

  await db.insert(fragments).values(
    QUOTES.map(([bookIndex, text, chapter]) => ({
      userId,
      kindId: quoteKindId,
      workId: bookIds[bookIndex],
      body: text,
      locator: chapter,
    })),
  );

  await db.insert(fragments).values(
    VOCABULARY.map(
      ([bookIndex, word, pronunciation, wordTranslation, sentence, sentenceTranslation]) => ({
        userId,
        kindId: vocabularyKindId,
        workId: bookIds[bookIndex],
        name: word,
        pronunciation,
        translation: wordTranslation,
        context: sentence,
        contextTranslation: sentenceTranslation,
      }),
    ),
  );

  return (
    `${email}：${BOOKS.length} 本書、${readingIds.length + 2} 次閱讀、${WRITINGS.length} 則書寫、` +
    `${QUOTES.length} 句佳句、${VOCABULARY.length} 個單字、${allKeywords.size} 個關鍵字`
  );
}
