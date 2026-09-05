import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { findOrCreateGoogleUser, findUserByEmail } from "@/lib/db/queries/users";

async function refreshAccessToken(refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    throw new Error("刷新 access token 失敗");
  }

  const data = await res.json();
  return {
    accessToken: data.access_token as string,
    expiresAt: Math.floor(Date.now() / 1000) + (data.expires_in as number),
    refreshToken: (data.refresh_token as string) ?? refreshToken,
  };
}

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
      }

      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        return token;
      }

      const expiresAt = token.expiresAt as number | undefined;
      if (expiresAt && Date.now() / 1000 < expiresAt - 60) {
        return token;
      }

      if (!token.refreshToken) {
        token.error = "RefreshTokenMissing";
        return token;
      }

      try {
        const refreshed = await refreshAccessToken(token.refreshToken as string);
        token.accessToken = refreshed.accessToken;
        token.expiresAt = refreshed.expiresAt;
        token.refreshToken = refreshed.refreshToken;
        delete token.error;
      } catch {
        token.error = "RefreshAccessTokenError";
      }

      return token;
    },
    async session({ session, token }) {
      session.user.id = token.userId as string;
      session.accessToken = token.accessToken as string;
      session.error = token.error as string | undefined;
      return session;
    },
  },
});
