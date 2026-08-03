"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { ArrowLeft, Bookmark, Grid3X3, Loader2, Heart } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { PostData } from "@/components/PostCard";
import { useState } from "react";

export default function SavedPage() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);

  const { data, isLoading } = useQuery<{ posts: PostData[] }>({
    queryKey: ["saved-posts"],
    queryFn: async () => {
      const res = await fetch("/api/user/bookmarks");
      if (!res.ok) throw new Error("Không thể tải bài đã lưu");
      return res.json();
    },
    enabled: !!session,
  });

  // Unbookmark mutation
  const { mutate: unbookmark } = useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`/api/posts/${postId}/bookmark`, { method: "POST" });
      if (!res.ok) throw new Error("Thao tác thất bại");
      return res.json();
    },
    onSuccess: (result, postId) => {
      toast.success("Đã bỏ lưu");
      queryClient.setQueryData<{ posts: PostData[] }>(["saved-posts"], (old) => {
        if (!old) return old;
        return { posts: old.posts.filter((p) => p._id !== postId) };
      });
      setSelectedPost(null);
    },
    onError: () => toast.error("Thao tác thất bại"),
  });

  const posts = data?.posts ?? [];

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
        <p className="text-white text-sm font-semibold">Bài viết đã lưu</p>
      </div>

      <div className="pt-14 max-w-2xl mx-auto px-4 py-6">
        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
          </div>
        )}

        {!isLoading && posts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-16 h-16 rounded-2xl border border-white/10 flex items-center justify-center">
              <Bookmark className="w-7 h-7 text-white/20" />
            </div>
            <p className="text-white/40 text-sm font-medium">Chưa có bài viết nào được lưu</p>
            <p className="text-white/20 text-xs">Nhấn icon bookmark trên bài viết để lưu lại</p>
            <Link
              href="/"
              className="px-4 py-2 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 text-sm hover:bg-purple-600/30 transition-all"
            >
              Khám phá bài viết
            </Link>
          </div>
        )}

        {/* Grid */}
        {posts.length > 0 && (
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

      {/* Post detail modal */}
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
            {/* Header */}
            <div className="flex items-center gap-3 p-4 border-b border-white/8">
              <Link href={`/user/${selectedPost.user.username}`}>
                {selectedPost.user.avatar ? (
                  <img
                    src={selectedPost.user.avatar}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                    {selectedPost.user.username[0].toUpperCase()}
                  </div>
                )}
              </Link>
              <p className="text-white text-sm font-medium flex-1">
                @{selectedPost.user.username}
              </p>
              <button
                onClick={() => unbookmark(selectedPost._id)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-500/15 text-purple-400 text-xs hover:bg-red-500/15 hover:text-red-400 transition-all"
              >
                <Bookmark className="w-3.5 h-3.5 fill-current" />
                Bỏ lưu
              </button>
              <button
                onClick={() => setSelectedPost(null)}
                className="text-white/40 hover:text-white text-lg ml-1"
              >
                ✕
              </button>
            </div>

            {selectedPost.images && selectedPost.images.length > 0 && (
              <div className="bg-black">
                <img
                  src={selectedPost.images[0]}
                  alt=""
                  className="w-full max-h-80 object-contain"
                />
              </div>
            )}

            {selectedPost.content && (
              <div className="px-4 py-3">
                <p className="text-white/80 text-sm leading-relaxed">
                  {selectedPost.content}
                </p>
              </div>
            )}

            <div className="flex items-center gap-4 px-4 py-3 border-t border-white/8 text-white/40 text-xs">
              <span className="flex items-center gap-1">
                <Heart className="w-3.5 h-3.5" />
                {selectedPost.likes?.length ?? 0}
              </span>
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
