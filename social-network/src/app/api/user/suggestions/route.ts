// src/app/api/user/suggestions/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import mongoose from "mongoose";

// GET /api/user/suggestions — Gợi ý follow: users nhiều follower nhất mà chưa follow
export async function GET() {
  try {
    await connectDB();

    const session = await auth();
    const currentUserId = session?.user?.id;

    // IDs cần loại trừ: bản thân + đã đang follow
    let excludeIds: string[] = [];
    if (currentUserId && mongoose.isValidObjectId(currentUserId)) {
      const currentUser = await User.findById(currentUserId)
        .select("following")
        .lean();
      if (currentUser) {
        excludeIds = [
          currentUserId,
          ...currentUser.following.map((id: { toString(): string }) => id.toString()),
        ];
      }
    }

    const suggestions = await User.aggregate([
      {
        $match: {
          _id: {
            $nin: excludeIds.map((id) => new mongoose.Types.ObjectId(id)),
          },
        },
      },
      {
        $addFields: {
          followersCount: { $size: "$followers" },
        },
      },
      { $sort: { followersCount: -1 } },
      { $limit: 5 },
      {
        $project: {
          username: 1,
          avatar: 1,
          bio: 1,
          followersCount: 1,
        },
      },
    ]);

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("[SUGGESTIONS_ERROR]", error);
    return NextResponse.json({ message: "Lỗi máy chủ" }, { status: 500 });
  }
}
