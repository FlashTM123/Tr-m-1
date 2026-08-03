// src/components/SSEProvider.tsx
// Component rỗng — chỉ dùng để mount useSSENotifications 1 lần toàn cục
// Đặt trong Providers nên sẽ tồn tại suốt lifetime app, không unmount khi đổi trang
"use client";

import { useSSENotifications } from "@/hooks/useSSENotifications";

export function SSEProvider() {
  useSSENotifications();
  return null; // không render gì cả
}
