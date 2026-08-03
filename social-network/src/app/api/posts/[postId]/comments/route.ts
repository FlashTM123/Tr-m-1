// src/app/api/posts/[postId]/comments/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import Comment from "@/models/Comment";
import Post from "@/models/Post";
import Notification from "@/models/Notification";
import { sendSSENotification } from "@/lib/sse";
import mongoose from "mongoose";

// GET: Lấy danh sách bình luận của một bài viết
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    await connectDB();

    const comments = await Comment.find({ post: postId })
      .populate("user", "username avatar")  // Gắn thông tin user vào mỗi comment
      .sort({ createdAt: 1 })               // Cũ nhất lên trên (ASC)
      .lean();

    return NextResponse.json({ comments });
  } catch (error) {
    console.error("[COMMENTS_GET_ERROR]", error);
    return NextResponse.json({ message: "Lỗi máy chủ" }, { status: 500 });
  }
}

// POST: Tạo bình luận mới
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !mongoose.isValidObjectId(session.user.id)) {
      return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
    }

    const { postId } = await params;
    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { message: "Nội dung bình luận không được trống" },
        { status: 400 }
      );
    }

    await connectDB();

    // Kiểm tra bài viết tồn tại
    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ message: "Bài viết không tồn tại" }, { status: 404 });
    }

    const newComment = await Comment.create({
      post: postId,
      user: session.user.id,
      content: content.trim(),
    });

    // Populate ngay để trả về đầy đủ thông tin
    await newComment.populate("user", "username avatar");

    // Tạo notification cho chủ bài (không tự thông báo cho chính mình)
    if (post.user.toString() !== session.user.id) {
      await Notification.create({
        recipient: post.user,
        sender: session.user.id,
        type: "comment",
        post: postId,
      });

      // Push SSE real-time
      sendSSENotification(post.user.toString(), {
        type: "comment",
        sender: {
          _id: session.user.id,
          username: (newComment.user as any).username,
          avatar: (newComment.user as any).avatar,
        },
        post: { _id: postId, content: content.trim() },
        read: false,
        createdAt: new Date().toISOString(),
      });
    }

    return NextResponse.json(
      { message: "Đã bình luận!", comment: newComment },
      { status: 201 }
    );
  } catch (error) {
    console.error("[COMMENTS_POST_ERROR]", error);
    return NextResponse.json({ message: "Lỗi máy chủ" }, { status: 500 });
  }
}
