// src/app/api/posts/[postId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import Comment from "@/models/Comment";
import mongoose from "mongoose";

// GET /api/posts/[postId] — Lấy 1 bài viết theo ID kèm comments
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    if (!mongoose.isValidObjectId(postId)) {
      return NextResponse.json({ message: "ID không hợp lệ" }, { status: 400 });
    }

    await connectDB();

    const post = await Post.findById(postId)
      .populate("user", "username avatar")
      .lean();

    if (!post) {
      return NextResponse.json({ message: "Bài viết không tồn tại" }, { status: 404 });
    }

    // Lấy comments kèm theo
    const comments = await Comment.find({ post: postId })
      .populate("user", "username avatar")
      .sort({ createdAt: 1 })
      .lean();

    // isFollowing nếu đã đăng nhập
    const session = await auth();

    return NextResponse.json({ post, comments, currentUserId: session?.user?.id ?? null });
  } catch (error) {
    console.error("[POST_GET_ERROR]", error);
    return NextResponse.json({ message: "Lỗi máy chủ" }, { status: 500 });
  }
}

// DELETE /api/posts/[postId] — Xóa bài viết (chỉ chủ bài)
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !mongoose.isValidObjectId(session.user.id)) {
      return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
    }

    const { postId } = await params;
    await connectDB();

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ message: "Bài viết không tồn tại" }, { status: 404 });
    }

    if (post.user.toString() !== session.user.id) {
      return NextResponse.json({ message: "Không có quyền xóa bài này" }, { status: 403 });
    }

    await Post.findByIdAndDelete(postId);
    await Comment.deleteMany({ post: postId });

    return NextResponse.json({ message: "Đã xóa bài viết" });
  } catch (error) {
    console.error("[POST_DELETE_ERROR]", error);
    return NextResponse.json({ message: "Lỗi máy chủ" }, { status: 500 });
  }
}
