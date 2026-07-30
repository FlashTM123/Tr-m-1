// src/app/api/stories/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import Story from "@/models/Story";
import mongoose from "mongoose";

// ─────────────────────────────────────────────────────────
// GET /api/stories — Lấy tất cả story còn hiệu lực (chưa hết 24h)
// ─────────────────────────────────────────────────────────
export async function GET() {
  try {
    await connectDB();

    const stories = await Story.find({
      expiresAt: { $gt: new Date() }, // chỉ lấy story chưa hết hạn
    })
      .populate("user", "username avatar")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ stories });
  } catch (error) {
    console.error("[STORIES_GET_ERROR]", error);
    return NextResponse.json({ message: "Lỗi máy chủ" }, { status: 500 });
  }
}

// ─────────────────────────────────────────────────────────
// POST /api/stories — Tạo story mới
// ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !mongoose.isValidObjectId(session.user.id)) {
      return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
    }

    await connectDB();

    const { mediaUrl, mediaType, caption } = await req.json();

    if (!mediaUrl) {
      return NextResponse.json({ message: "Thiếu media URL" }, { status: 400 });
    }

    const story = await Story.create({
      user:      session.user.id,
      mediaUrl,
      mediaType: mediaType ?? "image",
      caption:   caption?.trim() ?? "",
    });

    await story.populate("user", "username avatar");

    return NextResponse.json({ story }, { status: 201 });
  } catch (error) {
    console.error("[STORIES_POST_ERROR]", error);
    return NextResponse.json({ message: "Lỗi máy chủ" }, { status: 500 });
  }
}
