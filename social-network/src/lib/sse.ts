// src/lib/sse.ts
// Server-side SSE connection manager
// ⚠️ Dùng `global` thay vì module-level Map để đảm bảo TẤT CẢ route handlers
// chia sẻ cùng 1 instance — tránh module isolation issue của Next.js

const enc = new TextEncoder();

// Attach vào global object để share across module instances trong Next.js
const g = global as typeof globalThis & {
  _sseConnections?: Map<string, Set<ReadableStreamDefaultController<Uint8Array>>>;
};

if (!g._sseConnections) {
  g._sseConnections = new Map();
}

const connections = g._sseConnections;

/** Thêm connection mới khi client kết nối */
export function addSSEConnection(
  userId: string,
  controller: ReadableStreamDefaultController<Uint8Array>
) {
  if (!connections.has(userId)) {
    connections.set(userId, new Set());
  }
  connections.get(userId)!.add(controller);
  console.log(`[SSE] User ${userId} connected. Total connections: ${connections.size}`);
}

/** Xóa connection khi client đóng tab/disconnect */
export function removeSSEConnection(
  userId: string,
  controller: ReadableStreamDefaultController<Uint8Array>
) {
  const userConns = connections.get(userId);
  if (!userConns) return;
  userConns.delete(controller);
  if (userConns.size === 0) {
    connections.delete(userId);
  }
  console.log(`[SSE] User ${userId} disconnected. Total connections: ${connections.size}`);
}

/** Push notification event đến tất cả tab đang mở của 1 user */
export function sendSSENotification(
  recipientId: string,
  data: Record<string, unknown>
) {
  const userConns = connections.get(recipientId);
  console.log(`[SSE] Sending to ${recipientId}, connections found: ${userConns?.size ?? 0}`);

  if (!userConns || userConns.size === 0) return;

  const payload = enc.encode(`event: notification\ndata: ${JSON.stringify(data)}\n\n`);
  const dead: ReadableStreamDefaultController<Uint8Array>[] = [];

  for (const controller of userConns) {
    try {
      controller.enqueue(payload);
      console.log(`[SSE] Event pushed to ${recipientId} ✅`);
    } catch {
      dead.push(controller);
    }
  }

  for (const c of dead) removeSSEConnection(recipientId, c);
}

/** Gửi heartbeat */
export function sendSSEHeartbeat(
  userId: string,
  controller: ReadableStreamDefaultController<Uint8Array>
) {
  try {
    controller.enqueue(enc.encode(`: heartbeat\n\n`));
    return true;
  } catch {
    removeSSEConnection(userId, controller);
    return false;
  }
}
