import postgres from "postgres";

/**
 * 把 span 與 coordinates 這兩欄拆成各自的數字欄。
 *
 * 舊的一欄塞兩個值：span 是 "1818－1883"，coordinates 是 "25.033,121.565"。
 * 讀的時候都得剖析——破折號有好幾種寫法、西元前是負號、iOS Safari 不支援
 * lookbehind（見 types/keyword 的 splitSpan 註解）。拆成數字欄之後這些全部消失，
 * 而且畫數線與地圖不用再每次 parse。
 *
 * 剖析規則照舊那一份，不另外發明——搬過去的值要跟畫面現在顯示的一樣。
 *
 * 用法：
 *   npx tsx --env-file=.env.local scripts/split-span-coordinates.ts           乾跑
 *   npx tsx --env-file=.env.local scripts/split-span-coordinates.ts --apply   真的寫
 */

const APPLY = process.argv.includes("--apply");

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DIRECT_URL 或 DATABASE_URL 沒設");
const sql = postgres(url, { prepare: false, max: 2 });

/** 取開頭的年份，吃得下 "前384"、"-384"、"1949年4月6日"、"1949/4/6" */
function parseYear(value: string): number | null {
  const match = value.trim().match(/^(前\s*)?(-?\d+)/);
  if (!match) return null;
  const year = Number(match[2]);
  return match[1] ? -Math.abs(year) : year;
}

/** 只切最外層的起訖破折號；西元前的負號長得一樣，所以負號前面要有數字才算分隔 */
function splitSpan(value: string): [string, string?] {
  const match = value.match(/\d\s*[－–—-]/);
  if (!match || match.index === undefined) return [value];
  const index = match.index + match[0].length - 1;
  return [value.slice(0, index), value.slice(index + 1)];
}

function parseSpan(value: string): { from: number | null; to: number | null } {
  const [left, right] = splitSpan(value);
  const from = parseYear(left);
  // 沒有破折號就是單一年份，起訖同一年
  const to = right === undefined ? from : parseYear(right);
  return { from, to };
}

function parseCoordinates(value: string): { lat: number; lon: number } | null {
  const [lat, lon] = value.split(",").map((n) => Number(n.trim()));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
}

type Row = { id: string; name: string; span: string; coordinates: string };

async function run() {
  console.log(APPLY ? "== 寫入模式 ==\n" : "== 乾跑，不寫入（要改加 --apply）==\n");
  console.log("資料庫:", new URL(url!).username.split(".")[1] ?? "?", "\n");

  const rows = (await sql`
    select id, name, span, coordinates from domain_fragments
    where span <> '' or coordinates <> ''
    order by name`) as unknown as Row[];

  const plans = rows.map((row) => ({
    row,
    span: row.span ? parseSpan(row.span) : null,
    at: row.coordinates ? parseCoordinates(row.coordinates) : null,
  }));

  // 剖析不出來的要說出來：靜靜跳過等於資料無聲無息不見了
  const badSpan = plans.filter((p) => p.row.span && p.span?.from === null && p.span?.to === null);
  const badCoord = plans.filter((p) => p.row.coordinates && !p.at);

  console.log(`要搬的: ${plans.length} 筆\n`);
  for (const { row, span, at } of plans) {
    const parts = [
      span ? `${row.span} → ${span.from ?? "?"} / ${span.to ?? "?"}` : "",
      at ? `${row.coordinates} → ${at.lat}, ${at.lon}` : "",
    ].filter(Boolean);
    console.log(`  ${row.name}: ${parts.join("   ")}`);
  }

  if (badSpan.length || badCoord.length) {
    console.log("\n❌ 剖析不出來的：");
    for (const p of badSpan) console.log(`  起訖 ${p.row.name}: ${p.row.span}`);
    for (const p of badCoord) console.log(`  座標 ${p.row.name}: ${p.row.coordinates}`);
    console.log("先處理這幾筆再跑，不然它們會留在舊欄位裡沒人讀");
    return sql.end();
  }

  if (!APPLY) {
    console.log("\n（乾跑結束）");
    return sql.end();
  }

  for (const { row, span, at } of plans) {
    await sql`update domain_fragments set
      start_year = ${span?.from ?? null},
      end_year = ${span?.to ?? null},
      latitude = ${at?.lat ?? null},
      longitude = ${at?.lon ?? null}
      where id = ${row.id}`;
  }

  const [{ left }] = (await sql`
    select count(*)::int as left from domain_fragments
    where (span <> '' and start_year is null and end_year is null)
       or (coordinates <> '' and latitude is null)`) as [{ left: number }];

  console.log(left === 0 ? `\n✅ 搬完 ${plans.length} 筆` : `\n❌ 還有 ${left} 筆沒搬進去`);
  await sql.end();
}

run().catch(async (err) => {
  console.error(err);
  await sql.end();
  process.exit(1);
});
