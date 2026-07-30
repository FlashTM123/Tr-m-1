"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Loader2, Grid3X3, UserPlus, UserMinus, ArrowLeft, Calendar } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { useState } from "react";
import { PostData } from "@/components/PostCard";

// ─── Types ───────────────────────────────────────────────
interface ProfileUser {
  _id: string;
  username: string;
  email: string;
  avatar: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  createdAt: string;
}

interface ProfileData {
  user: ProfileUser;
  posts: PostData[];
  isFollowing: boolean;
  isOwnProfile: boolean;
}

// ─── Main Page ───────────────────────────────────────────
export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);

  // Fetch profile data
  const { data, isLoading, isError } = useQuery<ProfileData>({
    queryKey: ["profile", username],
    queryFn: async () => {
      const res = await fetch(`/api/user/${username}`);
      if (!res.ok) throw new Error("Không tìm thấy người dùng");
      return res.json();
    },
    enabled: !!username,
  });

  // Follow/Unfollow mutation
  const [isFollowing, setIsFollowing] = useState<boolean | null>(null);
  const effectiveIsFollowing = isFollowing ?? data?.isFollowing ?? false;

  const { mutate: toggleFollow, isPending } = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: data?.user._id }),
      });
      if (!res.ok) throw new Error("Thao tác thất bại");
      return res.json();
    },
    onMutate: () => setIsFollowing((prev) => !(prev ?? data?.isFollowing)),
    onSuccess: (result) => {
      setIsFollowing(result.isFollowing);
      toast.success(result.isFollowing ? "Đã follow! 🎉" : "Đã unfollow");
      queryClient.invalidateQueries({ queryKey: ["profile", username] });
    },
    onError: () => {
      setIsFollowing((prev) => !prev);
      toast.error("Thao tác thất bại");
    },
  });

  // ── Loading ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  // ── Not Found ────────────────────────────────────────
  if (isError || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex flex-col items-center justify-center gap-4">
        <div className="text-6xl">😕</div>
        <p className="text-white/60 text-lg">Không tìm thấy người dùng này</p>
        <Link href="/" className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm transition-all">
          Về trang chủ
        </Link>
      </div>
    );
  }

  const { user, posts, isOwnProfile } = data;

  return (
    <div className="min-h-screen bg-[#0a0a14]">
      {/* ── Top bar ── */}
      <div
        className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center px-4 gap-3 border-b border-white/8"
        style={{ background: "rgba(10,10,20,0.92)", backdropFilter: "blur(16px)" }}
      >
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/8 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <p className="text-white text-sm font-semibold">@{user.username}</p>
          <p className="text-white/40 text-xs">{posts.length} bài viết</p>
        </div>
      </div>

      <div className="pt-14 max-w-2xl mx-auto pb-16">
        {/* ── Cover gradient ── */}
        <div
          className="h-36 w-full relative"
          style={{
            background: "linear-gradient(135deg, #6d28d9 0%, #4f46e5 40%, #7c3aed 70%, #2563eb 100%)",
          }}
        >
          {/* Subtle pattern overlay */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* ── Profile info ── */}
        <div className="px-4 pb-4">
          <div className="flex items-end justify-between -mt-10 mb-4">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl border-4 border-[#0a0a14] overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-3xl font-bold">
                    {user.username[0].toUpperCase()}
                  </span>
                )}
              </div>
            </div>

            {/* Action button */}
            {session && (
              isOwnProfile ? (
                <Link
                  href="/settings"
                  className="px-4 py-1.5 rounded-xl border border-white/20 text-white/70 hover:text-white hover:border-white/40 text-sm font-medium transition-all"
                >
                  Chỉnh sửa
                </Link>
              ) : (
                <button
                  onClick={() => toggleFollow()}
                  disabled={isPending}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${
                    effectiveIsFollowing
                      ? "border border-white/20 text-white/60 hover:border-red-500/50 hover:text-red-400"
                      : "bg-purple-600 hover:bg-purple-500 text-white"
                  }`}
                >
                  {effectiveIsFollowing ? (
                    <><UserMinus className="w-3.5 h-3.5" /> Đang theo dõi</>
                  ) : (
                    <><UserPlus className="w-3.5 h-3.5" /> Theo dõi</>
                  )}
                </button>
              )
            )}
          </div>

          {/* Username & bio */}
          <div className="mb-4">
            <h1 className="text-white text-xl font-bold">@{user.username}</h1>
            {user.bio && (
              <p className="text-white/60 text-sm mt-1 leading-relaxed">{user.bio}</p>
            )}
            <div className="flex items-center gap-1.5 mt-2 text-white/30 text-xs">
              <Calendar className="w-3 h-3" />
              <span>
                Tham gia {format(new Date(user.createdAt), "MMMM yyyy", { locale: vi })}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mb-6">
            <div className="text-center">
              <p className="text-white font-bold text-lg">{posts.length}</p>
              <p className="text-white/40 text-xs">Bài viết</p>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-lg">{user.followersCount}</p>
              <p className="text-white/40 text-xs">Người theo dõi</p>
            </div>
            <div className="text-center">
              <p className="text-white font-bold text-lg">{user.followingCount}</p>
              <p className="text-white/40 text-xs">Đang theo dõi</p>
            </div>
          </div>

          {/* Tab bar */}
          <div className="flex gap-1 border-b border-white/8 mb-4">
            <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white border-b-2 border-purple-500">
              <Grid3X3 className="w-4 h-4" />
              Bài viết
            </button>
          </div>

          {/* ── Posts Grid ── */}
          {posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-16 h-16 rounded-2xl border border-white/10 flex items-center justify-center">
                <Grid3X3 className="w-6 h-6 text-white/20" />
              </div>
              <p className="text-white/30 text-sm">Chưa có bài viết nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {posts.map((post) => (
                <button
                  key={post._id}
                  onClick={() => setSelectedPost(post)}
                  className="aspect-square rounded-lg overflow-hidden relative group bg-white/5"
                >
                  {post.images && post.images.length > 0 ? (
                    <img
                      src={post.images[0]}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-2">
                      <p className="text-white/50 text-xs text-center line-clamp-4 leading-relaxed">
                        {post.content}
                      </p>
                    </div>
                  )}
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="flex items-center gap-3 text-white text-xs font-medium">
                      <span>❤️ {post.likes?.length ?? 0}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Post detail modal ── */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          style={{ backdropFilter: "blur(8px)" }}
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-white/10 overflow-hidden"
            style={{ background: "rgba(15,15,30,0.98)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Post header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/8">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                {user.username[0].toUpperCase()}
              </div>
              <p className="text-white text-sm font-medium">@{user.username}</p>
              <button
                onClick={() => setSelectedPost(null)}
                className="ml-auto text-white/40 hover:text-white text-lg"
              >
                ✕
              </button>
            </div>

            {/* Images */}
            {selectedPost.images && selectedPost.images.length > 0 && (
              <div className="bg-black">
                <img
                  src={selectedPost.images[0]}
                  alt=""
                  className="w-full max-h-80 object-contain"
                />
              </div>
            )}

            {/* Content */}
            {selectedPost.content && (
              <div className="px-4 py-3">
                <p className="text-white/80 text-sm leading-relaxed">{selectedPost.content}</p>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 px-4 py-3 border-t border-white/8 text-white/40 text-xs">
              <span>❤️ {selectedPost.likes?.length ?? 0} lượt thích</span>
              <Link
                href={`/post/${selectedPost._id}`}
                className="ml-auto text-purple-400 hover:text-purple-300 transition-colors"
              >
                Xem bài viết →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
