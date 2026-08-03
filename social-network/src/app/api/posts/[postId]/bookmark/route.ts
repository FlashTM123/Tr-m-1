// src/app/api/posts/[postId]/bookmark/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Post from "@/models/Post";
import mongoose from "mongoose";

// POST /api/posts/[postId]/bookmark — Toggle bookmark
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !mongoose.isValidObjectId(session.user.id)) {
      return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
    }

    const { postId } = await params;

    if (!mongoose.isValidObjectId(postId)) {
      return NextResponse.json({ message: "ID không hợp lệ" }, { status: 400 });
    }

    await connectDB();

    // Kiểm tra post tồn tại
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ message: "Bài viết không tồn tại" }, { status: 404 });
    }

    const user = await User.findById(session.user.id).select("bookmarks");
    if (!user) {
      return NextResponse.json({ message: "Người dùng không tồn tại" }, { status: 404 });
    }

    const isBookmarked = user.bookmarks.some(
      (id: { toString(): string }) => id.toString() === postId
    );

    if (isBookmarked) {
      await User.findByIdAndUpdate(session.user.id, {
        $pull: { bookmarks: postId },
      });
    } else {
      await User.findByIdAndUpdate(session.user.id, {
        $addToSet: { bookmarks: postId },
      });
    }

    return NextResponse.json({
      isBookmarked: !isBookmarked,
      message: isBookmarked ? "Đã bỏ lưu" : "Đã lưu bài viết",
    });
  } catch (error) {
    console.error("[BOOKMARK_ERROR]", error);
    return NextResponse.json({ message: "Lỗi máy chủ" }, { status: 500 });
  }
}
