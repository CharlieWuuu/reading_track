import postgres from "postgres";

/**
 * 把卡在共用類型上的資料接回自己那一份。
 *
 * 改一個共用類型（setting_kinds.user_id 是 NULL）會複製一列自己的、把「我在用」
 * 指過去，但舊版的 forkKind 沒把已經記的資料一起搬——數量照 kind_id 數，
 * 就變成「內容看得到、數量是 0」。程式那邊修好了，這支負責接回已經斷掉的。
 *
 * 只認「同 group 且同網址或同名」的那一份，而且只有一個候選才動；
 * 對不出唯一的一份就印出來，人來決定。
 *
 * 用法：
 *   npx tsx --env-file=.env.local scripts/relink-forked-kinds.ts           乾跑
 *   npx tsx --env-file=.env.local scripts/relink-forked-kinds.ts --apply   真的改
 */

const APPLY = process.argv.includes("--apply");

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DIRECT_URL 或 DATABASE_URL 沒設");
const sql = postgres(url, { prepare: false, max: 2 });

const TABLES = ["domain_works", "domain_fragments", "domain_writings"] as const;

type Orphan = {
  userId: string;
  sharedId: string;
  sharedName: string;
  sharedSlug: string;
  groupKey: string;
  n: number;
};

/** 掛在共用類型上、但那個使用者已經不在用它的資料 */
async function findOrphans(): Promise<Orphan[]> {
  const per = TABLES.map(
    (table) => sql`
      select d.user_id as "userId", k.id as "sharedId", k.name as "sharedName",
             k.slug as "sharedSlug", k.group_key as "groupKey", count(*)::int as n
      from ${sql(table)} d
      join setting_kinds k on k.id = d.kind_id
      where k.user_id is null
        and not exists (
          select 1 from setting_user_kinds uk
          where uk.user_id = d.user_id and uk.kind_id = k.id
        )
      group by d.user_id, k.id, k.name, k.slug, k.group_key
    `,
  );

  const rows = (await Promise.all(per)).flat() as Orphan[];

  const merged = new Map<string, Orphan>();
  for (const row of rows) {
    const key = `${row.userId}/${row.sharedId}`;
    const seen = merged.get(key);
    merged.set(key, seen ? { ...seen, n: seen.n + row.n } : row);
  }
  return [...merged.values()];
}

/** 這個人自己那一份：同 group，網址或名字對得上 */
async function targetFor(orphan: Orphan): Promise<{ id: string; name: string }[]> {
  return sql`
    select k.id, k.name
    from setting_kinds k
    join setting_user_kinds uk on uk.kind_id = k.id and uk.user_id = k.user_id
    where k.user_id = ${orphan.userId}
      and k.group_key = ${orphan.groupKey}
      and (k.slug = ${orphan.sharedSlug} or k.name = ${orphan.sharedName})
  ` as unknown as Promise<{ id: string; name: string }[]>;
}

async function move(orphan: Orphan, targetId: string): Promise<void> {
  await sql.begin(async (tx) => {
    for (const table of TABLES) {
      await tx`
        update ${tx(table)} set kind_id = ${targetId}
        where user_id = ${orphan.userId} and kind_id = ${orphan.sharedId}
      `;
    }
  });
}

async function main() {
  const orphans = await findOrphans();
  if (orphans.length === 0) {
    console.log("沒有卡住的資料");
    return;
  }

  let moved = 0;
  for (const orphan of orphans) {
    const targets = await targetFor(orphan);
    const where = `${orphan.sharedName}（${orphan.groupKey}）${orphan.n} 筆`;

    if (targets.length !== 1) {
      console.log(`跳過 ${where}：對到 ${targets.length} 份，要人工決定`);
      continue;
    }

    console.log(`${APPLY ? "搬" : "會搬"} ${where} → ${targets[0].name} ${targets[0].id}`);
    if (APPLY) {
      await move(orphan, targets[0].id);
      moved += orphan.n;
    }
  }

  console.log(APPLY ? `搬了 ${moved} 筆` : "乾跑，加 --apply 才會真的改");
}

main()
  .then(() => sql.end())
  .then(() => process.exit(0))
  .catch(async (err) => {
    console.error("失敗:", err.message);
    await sql.end();
    process.exit(1);
  });
