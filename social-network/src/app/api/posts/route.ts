// src/app/api/posts/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";         // Auth.js v5 — dùng auth() trực tiếp
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import User from "@/models/User";
import mongoose from "mongoose";

// ─────────────────────────────────────────────────────────
// GET /api/posts — Lấy danh sách bài viết (Newsfeed)
// Query params: ?feed=following → chỉ bài của người đang follow
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const feedMode = searchParams.get("feed"); // "following" hoặc null

    // Lấy session để biết user hiện tại
    const session = await auth();
    let feedUserIds: string[] = [];
    let followingIds: string[] = [];

    if (session?.user?.id && mongoose.isValidObjectId(session.user.id)) {
      // Tìm thông tin user hiện tại để lấy mảng following
      const currentUser = await User.findById(session.user.id).select("following").lean();
      if (currentUser) {
        followingIds = currentUser.following.map((id: { toString(): string }) => id.toString());
        // Gộp: ID của chính mình + tất cả người đang follow
        feedUserIds = [session.user.id, ...followingIds];
      }
    }

    let query: Record<string, unknown>;

    if (feedMode === "following") {
      // Tab "Đang theo dõi": chỉ bài của người đang follow (không bao gồm chính mình)
      if (followingIds.length === 0) {
        return NextResponse.json({ posts: [], currentUserFollowing: [] });
      }
      query = { user: { $in: followingIds } };
    } else {
      // Tab "Dành cho bạn": bài của mình + following; nếu chưa follow ai → discovery mode
      const followingCount = feedUserIds.length - 1; // trừ chính mình
      query = followingCount > 0
        ? { user: { $in: feedUserIds } }
        : {};
    }

    const posts = await Post.find(query)
      .populate("user", "username avatar")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({
      posts,
      currentUserFollowing: followingIds,
    });
  } catch (error) {
    console.error("[POSTS_GET_ERROR]", error);
    return NextResponse.json({ message: "Lỗi máy chủ" }, { status: 500 });
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

    if (!session?.user?.id || !mongoose.isValidObjectId(session.user.id)) {
      return NextResponse.json(
        { message: "Bạn cần đăng nhập để đăng bài" },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await req.json();
    const { content, images } = body; // nhận cả content lẫn mảng images URL

    // Bài viết phải có ít nhất nội dung hoặc ảnh
    if (!content?.trim() && (!images || images.length === 0)) {
      return NextResponse.json(
        { message: "Bài viết phải có nội dung hoặc ảnh" },
        { status: 400 }
      );
    }
    const newPost = await Post.create({
      user: session.user.id,
      content: content?.trim() ?? "",
      images: images ?? [],          // ← lưu mảng URL vào DB
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
