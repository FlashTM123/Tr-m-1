// src/app/api/user/bookmarks/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import mongoose from "mongoose";

// GET /api/user/bookmarks — Lấy danh sách bài viết đã lưu của user hiện tại
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || !mongoose.isValidObjectId(session.user.id)) {
      return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id)
      .select("bookmarks")
      .populate({
        path: "bookmarks",
        populate: { path: "user", select: "username avatar" },
        options: { sort: { createdAt: -1 } },
      })
      .lean();

    if (!user) {
      return NextResponse.json({ message: "Không tìm thấy người dùng" }, { status: 404 });
    }

    return NextResponse.json({ posts: user.bookmarks ?? [] });
  } catch (error) {
    console.error("[BOOKMARKS_GET_ERROR]", error);
    return NextResponse.json({ message: "Lỗi máy chủ" }, { status: 500 });
  }
}
