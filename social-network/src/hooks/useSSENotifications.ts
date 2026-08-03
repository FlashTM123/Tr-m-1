// src/hooks/useSSENotifications.ts
"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { NotificationData } from "@/types/notification";

const typeText = (type: NotificationData["type"]) => {
  switch (type) {
    case "like":    return "đã thích bài viết của bạn ❤️";
    case "comment": return "đã bình luận bài viết của bạn 💬";
    case "follow":  return "đã bắt đầu theo dõi bạn 👤";
  }
};

export function useSSENotifications() {
  const { data: session, status } = useSession();
  const queryClient = useQueryClient();
  const esRef = useRef<EventSource | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryCount = useRef(0);
  // Dùng ref để tránh stale closure trong onerror
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;

    const userId = session.user.id;
    userIdRef.current = userId;

    function connect() {
      // Đóng connection cũ
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }

      console.log("[SSE Hook] Connecting to stream...");
      const es = new EventSource("/api/notifications/stream");
      esRef.current = es;

      es.addEventListener("connected", (e: MessageEvent) => {
        console.log("[SSE Hook] ✅ Connected!", e.data);
        retryCount.current = 0;
      });

      es.addEventListener("notification", (e: MessageEvent) => {
        console.log("[SSE Hook] 🔔 Received notification!", e.data);
        try {
          const notif = JSON.parse(e.data) as NotificationData;

          // Toast popup
          if (notif.sender?.username) {
            toast(`@${notif.sender.username} ${typeText(notif.type)}`, {
              duration: 4000,
              action: notif.post?._id
                ? {
                    label: "Xem",
                    onClick: () => window.location.assign(`/post/${notif.post!._id}`),
                  }
                : undefined,
            });
          }

          // Cập nhật cache notifications list
          queryClient.setQueryData<{
            notifications: NotificationData[];
            unreadCount: number;
          }>(["notifications"], (old) => {
            if (!old) return { notifications: [notif], unreadCount: 1 };
            return {
              notifications: [notif, ...old.notifications],
              unreadCount: old.unreadCount + 1,
            };
          });

          // Cập nhật badge count — invalidate để force re-fetch từ server
          queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
        } catch (err) {
          console.error("[SSE Hook] Parse error:", err);
        }
      });

      es.onerror = (e) => {
        console.warn("[SSE Hook] ❌ Connection error, will retry...", e);
        es.close();
        esRef.current = null;

        retryCount.current += 1;
        const delay = Math.min(1000 * 2 ** retryCount.current, 30_000);
        console.log(`[SSE Hook] Retrying in ${delay}ms (attempt ${retryCount.current})`);

        retryRef.current = setTimeout(connect, delay);
      };
    }

    connect();

    return () => {
      console.log("[SSE Hook] Cleanup — closing connection");
      if (retryRef.current) clearTimeout(retryRef.current);
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
    };
    // queryClient là stable ref, không cần trong deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, status]);
}
