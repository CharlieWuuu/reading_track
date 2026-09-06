import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { findOrCreateGoogleUser, findUserByEmail } from "@/lib/db/queries/users";

export const { handlers, signIn, signOut, auth } = NextAuth({
  // 部署在 Vercel 時網域是平台給的，要信任 Host header 才能組出正確的 callback URL
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          // 只要登入用的三個範圍。紀錄改存自己的資料庫之後就不再碰使用者的檔案，
          // 留著 drive.file 等於要求一個用不到的權限
          scope: "openid email profile",
          // 這兩個是為了拿 refresh token 才加的，而續期那套 09-06 拆掉了，
          // 所以現在拿到的 refresh token 沒有人存也沒有人用。
          // 沒有一起刪：改的是登入流程本身（回訪會不會再跳同意畫面），
          // 跟「刪沒人呼叫的函式」不是同一種風險，要動就單獨動、單獨驗
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
    // demo 與沒有 Google 帳號的人。沒有註冊入口，帳號由 scripts/create-user 建
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw) {
        const email = String(raw?.email ?? "").trim();
        const password = String(raw?.password ?? "");
        if (!email || !password) return null;

        const user = await findUserByEmail(email);
        if (!user?.passwordHash) return null;
        if (!(await compare(password, user.passwordHash))) return null;

        return { id: user.id, email: user.email };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      // 每一種登入都要換到自己的 uuid，之後每一支查詢都靠它
      if (account?.provider === "google") {
        token.userId = await findOrCreateGoogleUser(
          account.providerAccountId,
          String(token.email ?? ""),
        );
      } else if (user?.id) {
        token.userId = user.id;
      } else if (!token.userId && token.email) {
        // 加多租戶之前就登入的 session，token 裡沒有 userId——用 email 補回來，
        // 不然每支查詢都拿 undefined 去比對
        token.userId = (await findUserByEmail(String(token.email)))?.id;
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.userId as string;
      return session;
    },
  },
});
