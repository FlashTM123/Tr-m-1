// src/app/api/posts/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";         // Auth.js v5 — dùng auth() trực tiếp
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";

// ─────────────────────────────────────────────────────────
// GET /api/posts — Lấy danh sách bài viết (Newsfeed)
// ─────────────────────────────────────────────────────────
export async function GET() {
  try {
    await connectDB();

    const posts = await Post.find()
      // populate: Thay ObjectId của user → document User thật
      // Chỉ lấy 2 trường: username và avatar (tiết kiệm bandwidth)
      .populate("user", "username avatar")
      // Mới nhất lên trên (descending theo thời gian tạo)
      .sort({ createdAt: -1 })
      // Giới hạn 20 bài mỗi lần (pagination cơ bản)
      .limit(20)
      // Chuyển Mongoose document → plain JS object để JSON.stringify
      .lean();

    return NextResponse.json({ posts }, { status: 200 });
  } catch (error) {
    console.error("[POSTS_GET_ERROR]", error);
    return NextResponse.json(
      { message: "Lỗi máy chủ" },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────────────────
// POST /api/posts — Tạo bài viết mới
// ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // Lấy session — auth() đọc JWT cookie tự động
    // Nếu chưa đăng nhập → session = null
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Bạn cần đăng nhập để đăng bài" },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await req.json();
    const { content } = body;

    if (!content?.trim()) {
      return NextResponse.json(
        { message: "Nội dung bài viết không được trống" },
        { status: 400 }
      );
    }

    // Tạo bài mới, gắn userId từ session
    const newPost = await Post.create({
      user: session.user.id,
      content: content.trim(),
      images: [],
      likes: [],
    });

    // Populate ngay sau khi tạo để trả về đầy đủ thông tin
    await newPost.populate("user", "username avatar");

    return NextResponse.json(
      { message: "Đăng bài thành công!", post: newPost },
      { status: 201 }
    );
  } catch (error) {
    console.error("[POSTS_POST_ERROR]", error);
    return NextResponse.json(
      { message: "Lỗi máy chủ" },
      { status: 500 }
    );
  }
}
