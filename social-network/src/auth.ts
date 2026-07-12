// src/auth.ts

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // ── PROVIDERS ──────────────────────────────────────────────────────────
  providers: [
    // --- Provider 1: Credentials (Email + Password tự chế) ---
    Credentials({
      name: "Credentials",

      // "credentials" khai báo shape của form login
      // Auth.js dùng để auto-generate form mặc định (nếu cần)
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      // authorize() là trái tim — chạy mỗi khi user đăng nhập
      // Trả về User object → đăng nhập thành công
      // Trả về null → đăng nhập thất bại
      async authorize(credentials) {
        // Guard: kiểm tra credentials có đủ không
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // ── Bước 1: Kết nối DB ────────────────────────────────
          await connectDB();

          // ── Bước 2: Tìm user theo email (lowercase) ──────────
          // .select("+password"): Mongoose mặc định có thể ẩn password
          // nên cần select rõ ràng để lấy ra khi so sánh
          const user = await User.findOne({
            email: (credentials.email as string).toLowerCase(),
          }).select("+password");

          // Không tìm thấy user → trả null
          if (!user) return null;

          // ── Bước 3: So sánh password ──────────────────────────
          // bcrypt.compare(plain, hashed):
          //   - "plain" = password người dùng vừa gõ
          //   - "hashed" = $2b$12$... đã lưu trong DB
          // Trả về true nếu khớp, false nếu không
          const isPasswordValid = await bcrypt.compare(
            credentials.password as string,
            user.password
          );

          // Password sai → trả null
          if (!isPasswordValid) return null;

          // ── Bước 4: Trả về User object cho Auth.js ────────────
          // Auth.js sẽ truyền object này vào jwt callback ở dưới
          // KHÔNG đưa password vào đây dù đã hash
          return {
            id: user._id.toString(), // ObjectId → string
            email: user.email,
            username: user.username,
            image: user.avatar || null,
          };
        } catch (error) {
          console.error("[AUTH_CREDENTIALS_ERROR]", error);
          return null; // Lỗi server → coi như đăng nhập thất bại
        }
      },
    }),

    // --- Provider 2: GitHub OAuth ---
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),

    // --- Provider 3: Google OAuth ---
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],

  // ── CALLBACKS ──────────────────────────────────────────────────────────
  callbacks: {
    // jwt callback: chạy khi tạo/cập nhật JWT token
    // "user" chỉ có mặt lần đầu tiên sau khi authorize() thành công
    async jwt({ token, user }) {
      if (user) {
        // Lần đầu đăng nhập: ghi thêm id và username vào token
        // Những lần sau (refresh session), "user" là undefined → bỏ qua
        token.id = user.id as string;
        token.username = (user as { username: string }).username;
      }
      return token;
    },

    // session callback: chạy mỗi khi client gọi useSession() hoặc auth()
    // Lấy dữ liệu từ token (đã được jwt callback ghi) → đưa vào session
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
      }
      return session;
    },
  },

  // ── SESSION STRATEGY ───────────────────────────────────────────────────
  session: {
    strategy: "jwt", // Dùng JWT (stateless) thay vì lưu session vào DB
    maxAge: 30 * 24 * 60 * 60, // Session hết hạn sau 30 ngày
  },

  // ── CUSTOM PAGES ───────────────────────────────────────────────────────
  // pages: {
  //   signIn: "/login", 
  // },
});
