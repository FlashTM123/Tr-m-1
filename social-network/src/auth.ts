// src/auth.ts
// File này chạy trên Node.js runtime — có thể dùng bcryptjs, mongoose, v.v.
// KHÔNG được import từ file này trong middleware.ts

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import authConfig from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Kế thừa toàn bộ config edge-safe (OAuth providers, session strategy, callbacks cơ bản)
  ...authConfig,

  // Thêm Credentials provider — chỉ hoạt động trong Node.js runtime
  providers: [
    ...authConfig.providers,
    Credentials({
      name: "Credentials",

      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      // authorize() cần bcryptjs + mongoose → chỉ chạy được trong Node.js runtime
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          await connectDB();

          const user = await User.findOne({
            email: (credentials.email as string).toLowerCase(),
          }).select("+password");

          if (!user || !user.password) return null;

          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          if (!isPasswordValid) return null;

          return {
            id: user._id.toString(),
            email: user.email,
            username: user.username,
            image: user.avatar || null,
          };
        } catch (error) {
          console.error("[AUTH_CREDENTIALS_ERROR]", error);
          return null;
        }
      },
    }),
  ],

  // Override callbacks để xử lý OAuth + Credentials đầy đủ (có DB access)
  callbacks: {
    // jwt callback: chạy khi tạo/cập nhật JWT token
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "credentials") {
          // ── Credentials login: user.id là MongoDB ObjectId hợp lệ ──
          token.id = user.id as string;
          token.username = (user as { username: string }).username;
        } else {
          // ── OAuth login (Google/GitHub): phải tìm hoặc tạo user trong MongoDB ──
          try {
            await connectDB();
            let dbUser = await User.findOne({ email: user.email });

            if (!dbUser) {
              // Lần đầu đăng nhập bằng OAuth → tạo user mới trong MongoDB
              const baseUsername = user.email!
                .split("@")[0]
                .replace(/[^a-zA-Z0-9_]/g, "_");
              let username = baseUsername;
              const usernameExists = await User.findOne({ username });
              if (usernameExists) {
                username = `${baseUsername}_${Date.now().toString().slice(-6)}`;
              }
              dbUser = await User.create({
                email: user.email!,
                username,
                avatar: user.image ?? "",
              });
            } else if (!dbUser.avatar && user.image) {
              dbUser.avatar = user.image;
              await dbUser.save();
            }

            token.id = dbUser._id.toString();
            token.username = dbUser.username;
          } catch (e) {
            console.error("[JWT_OAUTH_DB_ERROR]", e);
            token.id = user.id as string;
            token.username =
              user.name?.split(" ")[0] ?? user.email?.split("@")[0] ?? "user";
          }
        }
      }
      return token;
    },

    // session callback: lấy dữ liệu từ token → đưa vào session
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
      }
      return session;
    },
  },
});
