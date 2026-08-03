// src/auth.config.ts
// ⚠️ File này phải KHÔNG import bất kỳ thứ gì dùng Node.js API
// (bcryptjs, mongoose, mongodb...) vì nó được dùng trong Edge Runtime (middleware)

import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

export default {
  trustHost: true,
  providers: [
    // OAuth providers là edge-safe — chỉ cần client ID/secret
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    // Credentials provider KHÔNG đặt ở đây vì authorize() cần bcryptjs + mongoose
    // Nó được thêm trong auth.ts (Node.js runtime)
  ],

  // callbacks cần thiết cho middleware: authorized()
  callbacks: {
    authorized({ auth }) {
      // auth !== null nghĩa là có session hợp lệ
      // Middleware sẽ dùng điều này để kiểm tra route protection
      return !!auth;
    },
    // Phải re-khai báo session callback ở đây để token fields khả dụng trong Edge
    session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
      }
      return session;
    },
    jwt({ token, user }) {
      // jwt callback ở đây chỉ chạy khi user object có sẵn từ session đã tồn tại
      // Xử lý ban đầu (lần đăng nhập đầu) được thực hiện trong auth.ts
      return token;
    },
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
} satisfies NextAuthConfig;
