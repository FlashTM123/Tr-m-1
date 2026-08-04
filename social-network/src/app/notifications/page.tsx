"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { ArrowLeft, Bell, BellOff, Heart, MessageCircle, UserPlus, Loader2 } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import type { NotificationData } from "@/types/notification";

const typeIcon = (type: NotificationData["type"]) => {
  switch (type) {
    case "like":
      return <Heart className="w-3.5 h-3.5 fill-red-400 text-red-400" />;
    case "comment":
      return <MessageCircle className="w-3.5 h-3.5 text-blue-400" />;
    case "follow":
      return <UserPlus className="w-3.5 h-3.5 text-purple-400" />;
  }
};

const typeText = (type: NotificationData["type"]) => {
  switch (type) {
    case "like":
      return "đã thích bài viết của bạn";
    case "comment":
      return "đã bình luận bài viết của bạn";
    case "follow":
      return "đã bắt đầu theo dõi bạn";
  }
};

export default function NotificationsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<{
    notifications: NotificationData[];
    unreadCount: number;
  }>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Không thể tải thông báo");
      return res.json();
    },
    staleTime: 0,
    refetchOnMount: true,
    enabled: !!session,
  });

  const { mutate: markAllRead } = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications", { method: "PATCH" });
      if (!res.ok) throw new Error("Thất bại");
    },
    onSuccess: () => {
      // Cập nhật cache cho danh sách thông báo
      queryClient.setQueryData<{ notifications: NotificationData[]; unreadCount: number }>(
        ["notifications"],
        (old) => {
          if (!old) return old;
          return {
            notifications: old.notifications.map((n) => ({ ...n, read: true })),
            unreadCount: 0,
          };
        }
      );
      // Cập nhật cache cho badge ở Sidebar/Topbar
      queryClient.setQueryData<{ unreadCount: number }>(["notifications-count"], {
        unreadCount: 0,
      });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-count"] });
    },
  });

  // Tự động đánh dấu đã đọc khi vào trang thông báo
  useEffect(() => {
    if (data?.unreadCount && data.unreadCount > 0) {
      markAllRead();
    }
  }, [data?.unreadCount, markAllRead]);

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <div className="min-h-screen bg-[#0a0a14]">
      {/* Top bar */}
      <div
        className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-4 gap-3 border-b border-white/8"
        style={{ background: "rgba(10,10,20,0.92)", backdropFilter: "blur(16px)" }}
      >
        <Link
          href="/"
          className="w-8 h-8 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/8 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <p className="text-white text-sm font-semibold">
            Thông báo
            {unreadCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
          >
            Đọc hết
          </button>
        )}
      </div>

      <div className="pt-14 max-w-xl mx-auto px-4 py-4">
        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
              <BellOff className="w-7 h-7 text-white/20" />
            </div>
            <p className="text-white/30 text-sm">Chưa có thông báo nào</p>
            <p className="text-white/20 text-xs">Khi ai đó tương tác với bạn, thông báo sẽ hiện ở đây</p>
          </div>
        )}

        <div className="space-y-1">
          {notifications.filter((n) => n.sender != null).map((notif) => (
            <div
              key={notif._id}
              className={`flex items-start gap-3 p-4 rounded-2xl transition-all ${
                !notif.read ? "border border-purple-500/20" : "border border-transparent"
              }`}
              style={{
                background: notif.read
                  ? "rgba(255,255,255,0.02)"
                  : "rgba(139,92,246,0.06)",
              }}
            >
              {/* Unread dot */}
              {!notif.read && (
                <div className="absolute left-2 w-1.5 h-1.5 rounded-full bg-purple-500 mt-2" />
              )}

              {/* Avatar */}
              <Link href={`/user/${notif.sender.username}`} className="shrink-0">
                {notif.sender.avatar ? (
                  <img
                    src={notif.sender.avatar}
                    alt={notif.sender.username}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                    {notif.sender.username[0].toUpperCase()}
                  </div>
                )}
              </Link>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-sm leading-snug">
                  <Link
                    href={`/user/${notif.sender.username}`}
                    className="font-semibold text-white hover:text-purple-300 transition-colors"
                  >
                    @{notif.sender.username}
                  </Link>{" "}
                  {typeText(notif.type)}
                </p>
                {notif.post && (
                  <Link
                    href={`/post/${notif.post._id}`}
                    className="text-white/30 text-xs mt-1 line-clamp-1 hover:text-white/60 transition-colors block"
                  >
                    {notif.post.content || (notif.post.images?.length ? "📷 Ảnh" : "")}
                  </Link>
                )}
                <p className="text-white/25 text-xs mt-1">
                  {formatDistanceToNow(new Date(notif.createdAt), {
                    addSuffix: true,
                    locale: vi,
                  })}
                </p>
              </div>

              {/* Type icon */}
              <div className="shrink-0 w-7 h-7 rounded-full bg-white/8 flex items-center justify-center">
                {typeIcon(notif.type)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
