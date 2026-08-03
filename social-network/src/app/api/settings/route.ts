// src/app/api/settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import mongoose from "mongoose";

// PUT /api/settings — Cập nhật profile (avatar, bio, username)
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !mongoose.isValidObjectId(session.user.id)) {
      return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
    }

    const { avatar, bio, username } = await req.json();

    await connectDB();

    // Kiểm tra username trùng nếu có thay đổi
    if (username) {
      const trimmed = username.trim();
      if (trimmed.length < 3 || trimmed.length > 30) {
        return NextResponse.json(
          { message: "Username phải từ 3–30 ký tự" },
          { status: 400 }
        );
      }
      const existing = await User.findOne({
        username: trimmed,
        _id: { $ne: session.user.id },
      });
      if (existing) {
        return NextResponse.json(
          { message: "Username này đã được dùng" },
          { status: 409 }
        );
      }
    }

    // Chỉ update các field được gửi lên
    const updateFields: Record<string, string> = {};
    if (avatar !== undefined) updateFields.avatar = avatar;
    if (bio !== undefined) updateFields.bio = bio.slice(0, 160);
    if (username !== undefined) updateFields.username = username.trim();

    const updatedUser = await User.findByIdAndUpdate(
      session.user.id,
      { $set: updateFields },
      { new: true }
    ).select("username avatar bio");

    return NextResponse.json({
      message: "Cập nhật thành công!",
      user: updatedUser,
    });
  } catch (error) {
    console.error("[SETTINGS_PUT_ERROR]", error);
    return NextResponse.json({ message: "Lỗi máy chủ" }, { status: 500 });
  }
}

// GET /api/settings — Lấy thông tin profile hiện tại
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || !mongoose.isValidObjectId(session.user.id)) {
      return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id)
      .select("username email avatar bio followers following")
      .lean();

    if (!user) {
      return NextResponse.json({ message: "Không tìm thấy người dùng" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("[SETTINGS_GET_ERROR]", error);
    return NextResponse.json({ message: "Lỗi máy chủ" }, { status: 500 });
  }
}
