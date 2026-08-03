// src/app/api/user/friends/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import mongoose from "mongoose";

// GET /api/user/friends — Lấy danh sách following + followers của user hiện tại
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || !mongoose.isValidObjectId(session.user.id)) {
      return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id)
      .select("following followers")
      .populate("following", "username avatar bio followers")
      .populate("followers", "username avatar bio followers")
      .lean();

    if (!user) {
      return NextResponse.json({ message: "Không tìm thấy người dùng" }, { status: 404 });
    }

    // Format data
    const formatUser = (u: any) => ({
      _id: u._id,
      username: u.username,
      avatar: u.avatar,
      bio: u.bio,
      followersCount: u.followers?.length ?? 0,
    });

    return NextResponse.json({
      following: (user.following as any[]).map(formatUser),
      followers: (user.followers as any[]).map(formatUser),
    });
  } catch (error) {
    console.error("[FRIENDS_GET_ERROR]", error);
    return NextResponse.json({ message: "Lỗi máy chủ" }, { status: 500 });
  }
}
