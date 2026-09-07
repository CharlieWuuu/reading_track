import postgres from "postgres";

/**
 * 補封面：拿沒有封面的那幾次閱讀，去讀墨搜書名，把封面網址填回去。
 *
 * 用法：
 *   DATABASE_URL='...' npx tsx scripts/backfill-covers.ts            乾跑，只印對照表
 *   DATABASE_URL='...' npx tsx scripts/backfill-covers.ts --apply    真的寫入
 *
 * 只補 cover_url 是空字串的列，已經有封面的不動。書名對不上的印出來給人看，不猜。
 */

const APPLY = process.argv.includes("--apply");
const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL 沒設");

const sql = postgres(url, { prepare: false, max: 2 });

type Row = { id: string; title: string; author: string };
type Hit = { title: string; cover: string };

const norm = (s: string) =>
  s
    // 版次與宣傳詞不是書名的一部分：「異鄉人（新版）」與「異鄉人」是同一本
    .replace(
      /[（(【\[][^）)】\]]*(版|全|冊|紀念|首發|限定|典藏|精裝|平裝|套書)[^）)】\]]*[）)】\]]/g,
      "",
    )
    .replace(/(新版|二版|三版|初版|增訂版|修訂版|全新版|經典版|紀念版|暢銷版)$/g, "")
    .replace(/[\s：:，,。．・\-—–()（）【】《》〈〉!！?？]/g, "")
    .replace(/祕/g, "秘") // 讀墨用「祕」，多數出版社用「秘」
    .toLowerCase();

/**
 * 我的書名有多少被對方的書名照順序涵蓋。
 *
 * 兩個地方不能省：順序與方向。不看順序的話「致富心態」與「心態致富」會拿到滿分，
 * 那是兩本不同的書；用兩邊的長度當分母的話，「哈利波特：神秘的魔法石」對上通路那個
 * 掛滿宣傳詞的長書名只剩 0.42，但它其實就是同一本。所以分母只取我的書名。
 */
const coverage = (mine: string, theirs: string) => {
  const [x, y] = [norm(mine), norm(theirs)];
  if (!x || !y) return 0;
  const dp: number[][] = Array.from({ length: x.length + 1 }, () =>
    new Array(y.length + 1).fill(0),
  );
  for (let i = 1; i <= x.length; i++)
    for (let j = 1; j <= y.length; j++)
      dp[i][j] =
        x[i - 1] === y[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return dp[x.length][y.length] / x.length;
};

/** 套書合輯的封面是兩本併排的圖，不能當單書封面 */
const isBundle = (title: string) => /[Ｘ×]|套書|合輯|典藏組|限量組|\d+冊/.test(title);

/** 開頭兩個字要一樣。「遜咖日記」與「B咖日記」重疊率高，但一看開頭就知道不是 */
const samePrefix = (a: string, b: string) => norm(a).slice(0, 2) === norm(b).slice(0, 2);

const searchReadmoo = async (title: string): Promise<Hit[]> => {
  const res = await fetch(
    `https://readmoo.com/search/keyword?q=${encodeURIComponent(title)}&pi=0&st=true`,
    { headers: { "user-agent": "Mozilla/5.0" } },
  );
  if (!res.ok) return [];
  const html = await res.text();
  const imgs =
    html.match(/<img[^>]+data-lazy-original="https:\/\/cdn\.readmoo\.com\/cover\/[^"]+"[^>]*>/g) ??
    [];
  return imgs.flatMap((tag) => {
    const cover = tag.match(/data-lazy-original="([^"?]+)/)?.[1] ?? "";
    const alt = tag.match(/alt="([^"]*)"/)?.[1] ?? "";
    return cover && alt ? [{ title: alt, cover: cover.replace("_210x315", "_460x580") }] : [];
  });
};

/** Pubu 當第二來源。讀墨沒上架的書（哈利波特、異鄉人）它常常有 */
const searchPubu = async (title: string): Promise<Hit[]> => {
  const res = await fetch(`https://www.pubu.com.tw/search?q=${encodeURIComponent(title)}`, {
    headers: { "user-agent": "Mozilla/5.0" },
  });
  if (!res.ok) return [];
  const html = await res.text();
  const imgs =
    html.match(/<img[\s\S]{0,400}?data-src="https:\/\/res\d\.pubu\.tw\/[^"]+"[\s\S]{0,200}?\/>/g) ??
    [];
  return imgs.flatMap((tag) => {
    const cover = tag.match(/data-src="([^"]+)"/)?.[1] ?? "";
    const alt = tag.match(/title="([^"]*)"/)?.[1] ?? "";
    return cover && alt ? [{ title: alt, cover }] : [];
  });
};

const pick = (title: string, hits: Hit[]) =>
  hits
    .map((hit) => ({ ...hit, score: coverage(title, hit.title) }))
    .sort((a, b) => b.score - a.score)[0];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const main = async () => {
  const rows = (await sql`
    SELECT r.id, b.title, b.author
    FROM readings r
    JOIN books b ON b.id = r.book_id
    WHERE r.cover_url = ''
    ORDER BY b.title
  `) as unknown as Row[];

  console.log(`沒有封面的閱讀紀錄：${rows.length} 筆${APPLY ? "（寫入模式）" : "（乾跑）"}\n`);

  const matched: { id: string; title: string; hit: string; score: number; cover: string }[] = [];
  const unmatched: { title: string; best?: string; score: number }[] = [];

  const ok = (title: string, hit?: { title: string; score: number }) =>
    !!hit && hit.score >= 0.9 && samePrefix(title, hit.title) && !isBundle(hit.title);

  for (const row of rows) {
    let best = pick(row.title, await searchReadmoo(row.title));
    let from = "讀墨";
    if (!ok(row.title, best)) {
      await sleep(400);
      const alt = pick(row.title, await searchPubu(row.title)); // 讀墨沒有就換 Pubu
      if (ok(row.title, alt)) [best, from] = [alt, "Pubu"];
    }
    if (ok(row.title, best)) {
      matched.push({
        id: row.id,
        title: row.title,
        hit: best.title,
        score: best.score,
        cover: best.cover,
      });
      console.log(`✓ ${row.title}  →  ${best.title}  (${best.score.toFixed(2)}, ${from})`);
    } else {
      unmatched.push({ title: row.title, best: best?.title, score: best?.score ?? 0 });
      console.log(
        `· ${row.title}  →  查無把握的結果${best ? `（最近的是「${best.title}」${best.score.toFixed(2)}）` : ""}`,
      );
    }
    await sleep(400); // 別把人家的搜尋打爆
  }

  console.log(`\n對上 ${matched.length} 筆，沒把握 ${unmatched.length} 筆`);

  if (!APPLY) {
    console.log("乾跑結束，沒有寫入。確認上面的對照沒問題後加 --apply");
    await sql.end();
    return;
  }

  for (const m of matched) await sql`UPDATE readings SET cover_url = ${m.cover} WHERE id = ${m.id}`;
  console.log(`已寫入 ${matched.length} 筆封面`);
  await sql.end();
};

main().catch(async (err) => {
  console.error("失敗:", err.message);
  process.exit(1);
});
