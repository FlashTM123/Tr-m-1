// src/middleware.ts
// ⚠️ Middleware chạy trên Edge Runtime — chỉ được dùng các API edge-compatible
// Không import bcryptjs, mongoose, hay bất kỳ Node.js built-in module nào

import NextAuth from "next-auth";
import authConfig from "./auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Khởi tạo NextAuth CHỈ với edge-safe config (không có Credentials + mongoose)
const { auth } = NextAuth(authConfig);

// Các routes yêu cầu đăng nhập
const PROTECTED_ROUTES = ["/settings", "/notifications", "/saved", "/friends"];

// Middleware chính — nhận request đã được Auth.js xử lý
export default auth(function middleware(req) {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  // Kiểm tra route có cần bảo vệ không
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Nếu đã đăng nhập mà vào /login hoặc /register → chuyển về trang chủ
  if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Bỏ qua các file tĩnh và API routes của Next.js internals
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
