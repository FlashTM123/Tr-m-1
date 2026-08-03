// src/app/api/posts/[postId]/like/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import Notification from "@/models/Notification";
import { sendSSENotification } from "@/lib/sse";
import User from "@/models/User";
import mongoose from "mongoose";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !mongoose.isValidObjectId(session.user.id)) {
      return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
    }

    // params là Promise trong Next.js 15+ — phải await
    const { postId } = await params;

    await connectDB();

    const post = await Post.findById(postId);
    if (!post) {
      return NextResponse.json({ message: "Bài viết không tồn tại" }, { status: 404 });
    }

    // Kiểm tra đã like chưa
    const isLiked = post.likes.some(
      (id: { toString(): string }) => id.toString() === session.user.id
    );

    if (isLiked) {
      // UNLIKE: $pull xóa userId khỏi mảng likes
      await Post.findByIdAndUpdate(postId, {
        $pull: { likes: session.user.id },
      });
    } else {
      // LIKE: $addToSet thêm userId vào mảng likes (không trùng)
      await Post.findByIdAndUpdate(postId, {
        $addToSet: { likes: session.user.id },
      });

      // Tạo notification cho chủ bài (không tự thông báo cho chính mình)
      if (post.user.toString() !== session.user.id) {
        await Notification.findOneAndUpdate(
          { recipient: post.user, sender: session.user.id, type: "like", post: postId },
          { recipient: post.user, sender: session.user.id, type: "like", post: postId, read: false },
          { upsert: true }
        );

        // Push SSE notification real-time
        const sender = await User.findById(session.user.id).select("username avatar").lean();
        sendSSENotification(post.user.toString(), {
          type: "like",
          sender: { _id: session.user.id, username: sender?.username, avatar: sender?.avatar },
          post: { _id: postId },
          read: false,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Lấy số like mới nhất sau khi update
    const updatedPost = await Post.findById(postId).select("likes").lean();

    return NextResponse.json({
      likes: updatedPost?.likes ?? [],
      isLiked: !isLiked,       // đảo ngược trạng thái
      likeCount: updatedPost?.likes.length ?? 0,
    });
  } catch (error) {
    console.error("[LIKE_ERROR]", error);
    return NextResponse.json({ message: "Lỗi máy chủ" }, { status: 500 });
  }
}
