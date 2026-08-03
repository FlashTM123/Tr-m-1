"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { ArrowLeft, Users, UserPlus, UserMinus, Loader2 } from "lucide-react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useState } from "react";

interface FriendUser {
  _id: string;
  username: string;
  avatar: string;
  bio: string;
  followersCount: number;
}

interface FriendsData {
  following: FriendUser[];
  followers: FriendUser[];
}

export default function FriendsPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"following" | "followers">("following");

  const { data, isLoading } = useQuery<FriendsData>({
    queryKey: ["friends"],
    queryFn: async () => {
      const res = await fetch("/api/user/friends");
      if (!res.ok) throw new Error("Không thể tải");
      return res.json();
    },
    enabled: !!session,
  });

  const { mutate: toggleFollow } = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId }),
      });
      if (!res.ok) throw new Error("Thao tác thất bại");
      return res.json();
    },
    onSuccess: (result) => {
      toast.success(result.isFollowing ? "Đã follow! 🎉" : "Đã unfollow");
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
    onError: () => toast.error("Thao tác thất bại"),
  });

  const list = activeTab === "following" ? data?.following ?? [] : data?.followers ?? [];

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
        <p className="text-white text-sm font-semibold">Bạn bè</p>
      </div>

      <div className="pt-14 max-w-xl mx-auto px-4 py-4">
        {/* Tabs */}
        <div
          className="flex gap-1 mb-5 p-1 rounded-2xl border border-white/8"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          {(["following", "followers"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-purple-600/25 text-purple-300"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {tab === "following" ? "Đang theo dõi" : "Người theo dõi"}
              {data && (
                <span className="ml-1.5 text-xs opacity-60">
                  ({tab === "following" ? data.following.length : data.followers.length})
                </span>
              )}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
          </div>
        )}

        {!isLoading && list.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
              <Users className="w-7 h-7 text-white/20" />
            </div>
            <p className="text-white/30 text-sm">
              {activeTab === "following"
                ? "Bạn chưa theo dõi ai"
                : "Chưa có ai theo dõi bạn"}
            </p>
          </div>
        )}

        <div className="space-y-2">
          {list.map((user) => (
            <div
              key={user._id}
              className="flex items-center gap-3 p-4 rounded-2xl border border-white/8 hover:border-white/15 transition-all"
              style={{ background: "rgba(255,255,255,0.03)" }}
            >
              <Link href={`/user/${user.username}`} className="shrink-0">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-11 h-11 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                    {user.username[0].toUpperCase()}
                  </div>
                )}
              </Link>

              <Link href={`/user/${user.username}`} className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium hover:text-purple-300 transition-colors">
                  @{user.username}
                </p>
                {user.bio && (
                  <p className="text-white/40 text-xs mt-0.5 truncate">{user.bio}</p>
                )}
              </Link>

              {activeTab === "following" ? (
                <button
                  onClick={() => toggleFollow(user._id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border border-white/20 text-white/60 hover:border-red-500/50 hover:text-red-400 transition-all shrink-0"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                  Bỏ theo dõi
                </button>
              ) : (
                <button
                  onClick={() => toggleFollow(user._id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white transition-all shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Theo dõi lại
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
