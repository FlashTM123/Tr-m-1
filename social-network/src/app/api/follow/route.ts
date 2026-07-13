// src/app/api/user/follow/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
    }

    const { targetUserId } = await req.json();

    if (!targetUserId) {
      return NextResponse.json({ message: "Thiếu targetUserId" }, { status: 400 });
    }

    // Không cho tự follow chính mình
    if (targetUserId === session.user.id) {
      return NextResponse.json({ message: "Không thể follow chính mình" }, { status: 400 });
    }

    await connectDB();

    const currentUser = await User.findById(session.user.id);
    const targetUser = await User.findById(targetUserId);

    if (!currentUser || !targetUser) {
      return NextResponse.json({ message: "Người dùng không tồn tại" }, { status: 404 });
    }

    // Kiểm tra đã follow chưa bằng cách tìm targetUserId trong mảng following
    const isAlreadyFollowing = currentUser.following.some(
      (id) => id.toString() === targetUserId
    );

    if (isAlreadyFollowing) {
      // ── UNFOLLOW ─────────────────────────────────────────────────────
      // $pull: Xóa targetUserId khỏi mảng following của currentUser
      await User.findByIdAndUpdate(session.user.id, {
        $pull: { following: targetUserId },
      });

      // $pull: Xóa currentUserId khỏi mảng followers của targetUser
      await User.findByIdAndUpdate(targetUserId, {
        $pull: { followers: session.user.id },
      });

      return NextResponse.json({
        message: "Đã unfollow",
        isFollowing: false,
      });
    } else {
      // ── FOLLOW ───────────────────────────────────────────────────────
      // $addToSet: Giống $push nhưng không thêm nếu đã có — an toàn hơn
      await User.findByIdAndUpdate(session.user.id, {
        $addToSet: { following: targetUserId },
      });

      await User.findByIdAndUpdate(targetUserId, {
        $addToSet: { followers: session.user.id },
      });

      return NextResponse.json({
        message: "Đã follow",
        isFollowing: true,
      });
    }
  } catch (error) {
    console.error("[FOLLOW_ERROR]", error);
    return NextResponse.json({ message: "Lỗi máy chủ" }, { status: 500 });
  }
}
