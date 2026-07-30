// src/app/api/stories/[storyId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { connectDB } from "@/lib/db";
import Story from "@/models/Story";
import mongoose from "mongoose";

// DELETE /api/stories/[storyId] — Xóa story của mình
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !mongoose.isValidObjectId(session.user.id)) {
      return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
    }

    const { storyId } = await params;

    await connectDB();

    const story = await Story.findById(storyId);
    if (!story) {
      return NextResponse.json({ message: "Story không tồn tại" }, { status: 404 });
    }

    // Chỉ cho phép xóa story của chính mình
    if (story.user.toString() !== session.user.id) {
      return NextResponse.json({ message: "Không có quyền xóa" }, { status: 403 });
    }

    await Story.findByIdAndDelete(storyId);

    return NextResponse.json({ message: "Đã xóa story" });
  } catch (error) {
    console.error("[STORY_DELETE_ERROR]", error);
    return NextResponse.json({ message: "Lỗi máy chủ" }, { status: 500 });
  }
}

// PATCH /api/stories/[storyId] — Đánh dấu đã xem
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !mongoose.isValidObjectId(session.user.id)) {
      return NextResponse.json({ message: "Chưa đăng nhập" }, { status: 401 });
    }

    const { storyId } = await params;

    await connectDB();

    await Story.findByIdAndUpdate(storyId, {
      $addToSet: { viewers: session.user.id }, // không trùng lặp
    });

    return NextResponse.json({ message: "Đã xem" });
  } catch (error) {
    console.error("[STORY_VIEW_ERROR]", error);
    return NextResponse.json({ message: "Lỗi máy chủ" }, { status: 500 });
  }
}
