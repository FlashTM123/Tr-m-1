"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Search, UserPlus, UserMinus, ArrowLeft, Loader2, Users } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import type { Metadata } from "next";

// Types
interface SearchUser {
  _id: string;
  username: string;
  avatar: string;
  bio: string;
  followersCount: number;
  isFollowing: boolean;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  const timer = useCallback(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  useState(timer);
  return debounced;
}

export default function SearchPage() {
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const queryClient = useQueryClient();

  // Simple debounce via controlled state
  const [debouncedQ, setDebouncedQ] = useState("");
  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const handleInput = (val: string) => {
    setQuery(val);
    if (debounceTimer) clearTimeout(debounceTimer);
    const t = setTimeout(() => setDebouncedQ(val), 350);
    setDebounceTimer(t);
  };

  const { data, isLoading } = useQuery<{ users: SearchUser[] }>({
    queryKey: ["search", debouncedQ],
    queryFn: async () => {
      if (!debouncedQ.trim()) return { users: [] };
      const res = await fetch(`/api/search?q=${encodeURIComponent(debouncedQ)}`);
      if (!res.ok) throw new Error("Tìm kiếm thất bại");
      return res.json();
    },
    enabled: debouncedQ.trim().length > 0,
    staleTime: 10_000,
  });

  // Follow mutation
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
    onSuccess: (result, userId) => {
      queryClient.setQueryData<{ users: SearchUser[] }>(["search", debouncedQ], (old) => {
        if (!old) return old;
        return {
          users: old.users.map((u) =>
            u._id === userId ? { ...u, isFollowing: result.isFollowing } : u
          ),
        };
      });
      toast.success(result.isFollowing ? "Đã follow! 🎉" : "Đã unfollow");
    },
    onError: () => toast.error("Thao tác thất bại"),
  });

  const users = data?.users ?? [];

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
        <p className="text-white text-sm font-semibold">Tìm kiếm</p>
      </div>

      <div className="pt-14 max-w-xl mx-auto px-4 py-6">
        {/* Search input */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            id="search-input"
            autoFocus
            value={query}
            onChange={(e) => handleInput(e.target.value)}
            placeholder="Tìm kiếm người dùng..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-white/10 text-white placeholder:text-white/30 text-sm outline-none focus:border-purple-500/60 focus:ring-2 focus:ring-purple-500/15 transition-all"
            style={{ background: "rgba(255,255,255,0.05)" }}
          />
          {isLoading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400 animate-spin" />
          )}
        </div>

        {/* Empty state — no query */}
        {!debouncedQ && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/8 flex items-center justify-center">
              <Users className="w-7 h-7 text-white/20" />
            </div>
            <p className="text-white/30 text-sm">Nhập tên người dùng để tìm kiếm</p>
          </div>
        )}

        {/* Results */}
        {debouncedQ && !isLoading && users.length === 0 && (
          <div className="text-center py-16">
            <p className="text-white/40 text-sm">Không tìm thấy &quot;{debouncedQ}&quot;</p>
          </div>
        )}

        {users.length > 0 && (
          <div className="space-y-2">
            {users.map((user) => (
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
                  <p className="text-white/25 text-xs mt-0.5">
                    {user.followersCount} người theo dõi
                  </p>
                </Link>

                {session && (
                  <button
                    onClick={() => toggleFollow(user._id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all shrink-0 ${
                      user.isFollowing
                        ? "border border-white/20 text-white/60 hover:border-red-500/50 hover:text-red-400"
                        : "bg-purple-600 hover:bg-purple-500 text-white"
                    }`}
                  >
                    {user.isFollowing ? (
                      <><UserMinus className="w-3.5 h-3.5" /> Đang theo dõi</>
                    ) : (
                      <><UserPlus className="w-3.5 h-3.5" /> Theo dõi</>
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
