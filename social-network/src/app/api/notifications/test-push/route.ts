// src/app/api/notifications/test-push/route.ts
// Endpoint debug — test xem SSE có hoạt động không
// Gọi: POST /api/notifications/test-push  (chỉ dùng khi dev)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { sendSSENotification } from "@/lib/sse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  // Push test notification đến chính mình
  sendSSENotification(session.user.id, {
    type: "like",
    sender: {
      _id: session.user.id,
      username: session.user.username ?? "test",
      avatar: "",
    },
    post: { _id: "test-post-id" },
    read: false,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({
    message: "Test notification pushed",
    userId: session.user.id,
  });
}
