import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../src/lib/db/client";
import { users } from "../src/lib/db/schema/users";

/**
 * 帳密帳號由這支建，畫面上沒有註冊入口——開放註冊等於誰都能進來開帳號。
 *
 * 用法：DATABASE_URL='...' npx tsx scripts/create-user.ts <email> <密碼>
 * 同一個 email 再跑一次就是改密碼。
 */

const [email, password] = process.argv.slice(2);

async function main() {
  if (!email || !password) {
    console.error("用法：npx tsx scripts/create-user.ts <email> <密碼>");
    process.exit(1);
  }

  const passwordHash = await hash(password, 10);
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));

  if (existing) {
    await db.update(users).set({ passwordHash }).where(eq(users.id, existing.id));
    console.log(`已更新 ${email} 的密碼`);
  } else {
    await db.insert(users).values({ email, passwordHash });
    console.log(`已建立 ${email}`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("失敗:", err.message);
  process.exit(1);
});
