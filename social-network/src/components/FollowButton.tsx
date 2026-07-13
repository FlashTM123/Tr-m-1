// src/components/FollowButton.tsx
"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UserPlus, UserMinus } from "lucide-react";

interface FollowButtonProps {
  targetUserId: string;
  isFollowing: boolean;
  currentUserId: string;
}

export default function FollowButton({
  targetUserId,
  isFollowing: initialIsFollowing,
  currentUserId
}: FollowButtonProps) {
  // Local state để UI phản hồi ngay lập tức (Optimistic UI)
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const queryClient = useQueryClient();

  const { mutate: toggleFollow, isPending } = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Thao tác thất bại");
      }
      return res.json();
    },

    // Optimistic Update: Đổi trạng thái ngay trước khi API trả về
    // → UI phản hồi tức thì, không cần chờ server
    onMutate: () => {
      setIsFollowing((prev) => !prev);
    },

    onSuccess: (data) => {
      // Sync lại với dữ liệu thật từ server
      setIsFollowing(data.isFollowing);
      toast.success(data.isFollowing ? "Đã follow! 🎉" : "Đã unfollow");

      // Làm mới Newsfeed để cập nhật bài viết theo danh sách follow mới
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },

    onError: (error: Error) => {
      // Rollback optimistic update nếu API lỗi
      setIsFollowing((prev) => !prev);
      toast.error(error.message);
    },
  });

  return (
    <button
      onClick={() => toggleFollow()}
      disabled={isPending}
      className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
        isFollowing
          ? "border border-white/20 text-white/60 hover:border-red-500/50 hover:text-red-400"
          : "bg-purple-600/25 border border-purple-500/50 text-purple-300 hover:bg-purple-600/40"
      }`}
    >
      {isFollowing ? (
        <>
          <UserMinus className="w-3 h-3" />
          Unfollow
        </>
      ) : (
        <>
          <UserPlus className="w-3 h-3" />
          Follow
        </>
      )}
    </button>
  );
}
