"use client";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  Loader2,
  ArrowLeft,
  Heart,
  MessageCircle,
  Send,
  MoreHorizontal,
  Bookmark,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { useState } from "react";
import { PostData, CommentData } from "@/components/PostCard";
import FollowButton from "@/components/FollowButton";

interface PostDetailData {
  post: PostData;
  comments: CommentData[];
  currentUserId: string | null;
}

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>();
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [commentInput, setCommentInput] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);

  const { data, isLoading, isError } = useQuery<PostDetailData>({
    queryKey: ["post", postId],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${postId}`);
      if (!res.ok) throw new Error("Không tìm thấy bài viết");
      return res.json();
    },
    enabled: !!postId,
  });

  // Like mutation
  const { mutate: toggleLike } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
      if (!res.ok) throw new Error("Thao tác thất bại");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
    onError: () => toast.error("Thao tác thất bại"),
  });

  // Comment mutation
  const { mutate: submitComment, isPending: isSubmitting } = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message);
      }
      return res.json();
    },
    onSuccess: () => {
      setCommentInput("");
      queryClient.invalidateQueries({ queryKey: ["post", postId] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex flex-col items-center justify-center gap-4">
        <div className="text-5xl">😕</div>
        <p className="text-white/60">Không tìm thấy bài viết</p>
        <Link
          href="/"
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm transition-all"
        >
          Về trang chủ
        </Link>
      </div>
    );
  }

  const { post, comments } = data;
  const isLiked = post.likes.includes(session?.user?.id ?? "");
  const isOwnPost = session?.user?.id === post.user._id;

  return (
    <div className="min-h-screen bg-[#0a0a14]">
      {/* Top bar */}
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
        <p className="text-white text-sm font-semibold">Bài viết</p>
      </div>

      <div className="pt-14 max-w-xl mx-auto px-4 py-6 pb-32">
        {/* Post */}
        <div
          className="rounded-2xl border border-white/10 p-5 mb-4"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <Link
              href={`/user/${post.user.username}`}
              className="flex items-center gap-3 group"
            >
              {post.user.avatar ? (
                <img
                  src={post.user.avatar}
                  alt={post.user.username}
                  className="w-11 h-11 rounded-full object-cover"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                  {post.user.username[0].toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-white font-semibold text-sm group-hover:text-purple-300 transition-colors">
                  @{post.user.username}
                </p>
                <p className="text-white/40 text-xs">
                  {formatDistanceToNow(new Date(post.createdAt), {
                    addSuffix: true,
                    locale: vi,
                  })}
                </p>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              {session && !isOwnPost && (
                <FollowButton
                  targetUserId={post.user._id}
                  isFollowing={false}
                  currentUserId={session.user.id ?? ""}
                />
              )}
              <button className="text-white/30 hover:text-white/70 p-1 rounded-lg hover:bg-white/5 transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          {post.content && (
            <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap mb-4">
              {post.content}
            </p>
          )}

          {/* Images */}
          {post.images && post.images.length > 0 && (
            <div className="mb-4">
              {/* Main image */}
              <div className="rounded-xl overflow-hidden mb-2 bg-black">
                <img
                  src={post.images[selectedImage]}
                  alt={`Ảnh ${selectedImage + 1}`}
                  className="w-full max-h-[500px] object-contain"
                />
              </div>
              {/* Thumbnails nếu nhiều hơn 1 ảnh */}
              {post.images.length > 1 && (
                <div className="flex gap-1.5">
                  {post.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        i === selectedImage
                          ? "border-purple-500"
                          : "border-transparent opacity-60 hover:opacity-80"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center gap-4 text-white/40 text-xs mb-3 pb-3 border-b border-white/8">
            <span>{post.likes.length} lượt thích</span>
            <span>{comments.length} bình luận</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => session && toggleLike()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all group ${
                isLiked
                  ? "text-red-400 bg-red-500/10"
                  : "text-white/50 hover:text-red-400 hover:bg-red-500/10"
              }`}
            >
              <Heart
                className={`w-4 h-4 group-hover:scale-125 transition-transform ${isLiked ? "fill-red-400" : ""}`}
              />
              <span>Thích</span>
            </button>
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-blue-400/70 bg-blue-500/10 text-xs">
              <MessageCircle className="w-4 h-4" />
              <span>Bình luận</span>
            </button>
          </div>
        </div>

        {/* Comment input */}
        {session && (
          <div
            className="rounded-2xl border border-white/10 p-4 mb-4"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {session.user?.username?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Viết bình luận..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && commentInput.trim()) {
                      submitComment(commentInput);
                    }
                  }}
                  className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-white text-sm placeholder:text-white/30 outline-none focus:border-purple-500/50 transition-colors"
                />
                <button
                  onClick={() => commentInput.trim() && submitComment(commentInput)}
                  disabled={isSubmitting || !commentInput.trim()}
                  className="w-9 h-9 rounded-full bg-purple-600/30 text-purple-300 hover:bg-purple-600/50 transition-all disabled:opacity-40 flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Comments list */}
        <div className="space-y-3">
          {comments.length === 0 && (
            <p className="text-white/25 text-sm text-center py-6">
              Chưa có bình luận nào. Hãy là người đầu tiên! 💬
            </p>
          )}
          {comments.map((comment) => (
            <div
              key={comment._id}
              className="flex gap-3 rounded-2xl border border-white/6 p-4"
              style={{ background: "rgba(255,255,255,0.02)" }}
            >
              <Link href={`/user/${comment.user.username}`}>
                {comment.user.avatar ? (
                  <img
                    src={comment.user.avatar}
                    alt={comment.user.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                    {comment.user.username[0].toUpperCase()}
                  </div>
                )}
              </Link>
              <div className="flex-1">
                <Link
                  href={`/user/${comment.user.username}`}
                  className="text-white text-xs font-semibold hover:text-purple-300 transition-colors"
                >
                  @{comment.user.username}
                </Link>
                <p className="text-white/80 text-sm mt-0.5 leading-relaxed">
                  {comment.content}
                </p>
                <p className="text-white/25 text-xs mt-1">
                  {formatDistanceToNow(new Date(comment.createdAt), {
                    addSuffix: true,
                    locale: vi,
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
