// src/app/api/notifications/stream/route.ts
// SSE endpoint — giữ kết nối mở, push event khi có notification mới

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import mongoose from "mongoose";
import { addSSEConnection, removeSSEConnection, sendSSEHeartbeat } from "@/lib/sse";

// Bắt buộc dùng Node.js runtime (không phải Edge) vì:
// 1. Dùng module-level Map từ sse.ts
// 2. Cần long-lived connections (setInterval)
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id || !mongoose.isValidObjectId(session.user.id)) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  let controller: ReadableStreamDefaultController<Uint8Array>;
  let heartbeatTimer: ReturnType<typeof setInterval>;

  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      controller = ctrl;
      const enc = new TextEncoder();

      // Đăng ký connection
      addSSEConnection(userId, controller);

      // Gửi event "connected" để client biết SSE đang hoạt động
      controller.enqueue(
        enc.encode(`event: connected\ndata: {"userId":"${userId}"}\n\n`)
      );

      // Heartbeat mỗi 25 giây để giữ connection sống
      // (proxy/load balancer thường timeout sau 30s idle)
      heartbeatTimer = setInterval(() => {
        const alive = sendSSEHeartbeat(userId, controller);
        if (!alive) clearInterval(heartbeatTimer);
      }, 25_000);
    },

    cancel() {
      // Được gọi khi client đóng tab hoặc disconnect
      clearInterval(heartbeatTimer);
      if (controller) removeSSEConnection(userId, controller);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      // Tắt buffering trên Nginx/proxy
      "X-Accel-Buffering": "no",
    },
  });
}
