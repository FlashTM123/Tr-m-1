// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import Notification from "@/models/Notification";
import mongoose from "mongoose";

// GET /api/notifications — Lấy notifications của user hiện tại
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !mongoose.isValidObjectId(session.user.id)) {
      return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);

    await connectDB();

    const notifications = await Notification.find({ recipient: session.user.id })
      .populate("sender", "username avatar")
      .populate("post", "content images")
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const unreadCount = await Notification.countDocuments({
      recipient: session.user.id,
      read: false,
    });

    // Lọc bỏ notification có sender bị xóa (populate trả về null)
    const validNotifications = notifications.filter(
      (n: any) => n.sender != null
    );

    return NextResponse.json({ notifications: validNotifications, unreadCount });
  } catch (error) {
    console.error("[NOTIFICATIONS_GET_ERROR]", error);
    return NextResponse.json({ message: "Lỗi máy chủ" }, { status: 500 });
  }
}

// PATCH /api/notifications — Đánh dấu tất cả là đã đọc
export async function PATCH() {
  try {
    const session = await auth();
    if (!session?.user?.id || !mongoose.isValidObjectId(session.user.id)) {
      return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
    }

    await connectDB();

    await Notification.updateMany(
      { recipient: session.user.id, read: false },
      { $set: { read: true } }
    );

    return NextResponse.json({ message: "Đã đánh dấu tất cả là đã đọc" });
  } catch (error) {
    console.error("[NOTIFICATIONS_PATCH_ERROR]", error);
    return NextResponse.json({ message: "Lỗi máy chủ" }, { status: 500 });
  }
}
