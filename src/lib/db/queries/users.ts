import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema/users";

/**
 * 登入時把「這個人」換成資料庫裡的 uuid。
 *
 * 兩種入口都走這裡：Google 認 sub，帳密認 email。sub 而不是 email——
 * email 換得掉，換掉就對不上同一個人。
 */

export async function findOrCreateGoogleUser(googleSub: string, email: string): Promise<string> {
  const [bySub] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.googleSub, googleSub));
  if (bySub) return bySub.id;

  // 先用帳密註冊、之後才接 Google 的人：認 email 併回同一列，不另開一個帳號
  const [byEmail] = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
  if (byEmail) {
    await db.update(users).set({ googleSub }).where(eq(users.id, byEmail.id));
    return byEmail.id;
  }

  const [created] = await db.insert(users).values({ email, googleSub }).returning({ id: users.id });
  return created.id;
}

export async function findUserByEmail(email: string) {
  const [row] = await db
    .select({ id: users.id, email: users.email, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email));
  return row ?? null;
}
