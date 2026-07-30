// src/app/api/user/[username]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import Post from "@/models/Post";
import mongoose from "mongoose";

// GET /api/user/[username] — Lấy profile + bài viết của user
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    await connectDB();

    // Tìm user theo username (case-insensitive)
    const user = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, "i") },
    })
      .select("username email avatar bio followers following createdAt")
      .lean();

    if (!user) {
      return NextResponse.json({ message: "Người dùng không tồn tại" }, { status: 404 });
    }

    // Lấy tất cả bài viết của user, mới nhất trước
    const posts = await Post.find({ user: user._id })
      .populate("user", "username avatar")
      .sort({ createdAt: -1 })
      .lean();

    // Kiểm tra user hiện tại có đang follow user này không
    const session = await auth();
    let isFollowing = false;
    let isOwnProfile = false;

    if (session?.user?.id && mongoose.isValidObjectId(session.user.id)) {
      isOwnProfile = session.user.id === user._id.toString();

      if (!isOwnProfile) {
        // Kiểm tra trong mảng followers của profile user
        isFollowing = user.followers.some(
          (id) => id.toString() === session.user.id
        );
      }
    }

    return NextResponse.json({
      user: {
        ...user,
        followersCount: user.followers.length,
        followingCount: user.following.length,
        // Không trả về mảng đầy đủ để tiết kiệm bandwidth
        followers: undefined,
        following: undefined,
      },
      posts,
      isFollowing,
      isOwnProfile,
    });
  } catch (error) {
    console.error("[PROFILE_GET_ERROR]", error);
    return NextResponse.json({ message: "Lỗi máy chủ" }, { status: 500 });
  }
}
