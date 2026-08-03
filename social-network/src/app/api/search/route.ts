// src/app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import mongoose from "mongoose";

// GET /api/search?q=<query>&limit=10
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "10"), 20);

    if (!q || q.length < 1) {
      return NextResponse.json({ users: [] });
    }

    await connectDB();

    const session = await auth();

    // Tìm user theo username (case-insensitive, regex)
    const users = await User.find({
      username: { $regex: q, $options: "i" },
      // Không hiện chính mình
      ...(session?.user?.id && mongoose.isValidObjectId(session.user.id)
        ? { _id: { $ne: session.user.id } }
        : {}),
    })
      .select("username avatar bio followers")
      .limit(limit)
      .lean();

    // Kèm theo isFollowing nếu đã đăng nhập
    const currentUserId = session?.user?.id;
    const result = users.map((user) => ({
      _id: user._id,
      username: user.username,
      avatar: user.avatar,
      bio: user.bio,
      followersCount: user.followers.length,
      isFollowing: currentUserId
        ? user.followers.some((id: { toString(): string }) => id.toString() === currentUserId)
        : false,
    }));

    return NextResponse.json({ users: result });
  } catch (error) {
    console.error("[SEARCH_ERROR]", error);
    return NextResponse.json({ message: "Lỗi máy chủ" }, { status: 500 });
  }
}
