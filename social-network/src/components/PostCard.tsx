// src/components/PostCard.tsx
"use client";

import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Heart, MessageCircle, Share2, MoreHorizontal, Bookmark, Edit3, Trash2, Check, X, Loader2 } from "lucide-react";
import FollowButton from "./FollowButton";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";

export interface CommentData {
  _id: string;
  content: string;
  createdAt: string;
  user: {
    _id: string;
    username: string;
    avatar: string;
  };
}

// Cập nhật PostData — đảm bảo likes là mảng string
export interface PostData {
  _id: string;
  content: string;
  images: string[];
  likes: string[];          // mảng userId đã like
  createdAt: string;
  user: {
    _id: string;
    username: string;
    avatar: string;
  };
}


interface PostCardProps {
  post: PostData;
  currentUserId?: string; // ID của người dùng hiện tại (nếu đã đăng nhập)
  currentUserFollowing?: string[]; // Danh sách ID người dùng mà currentUser đang follow  
  bookmarkedPostIds?: string[]; // Danh sách ID bài viết đã bookmark
}

export default function PostCard({ post, currentUserId, currentUserFollowing, bookmarkedPostIds }: PostCardProps) {
  // formatDistanceToNow: "5 phút trước", "2 giờ trước", "3 ngày trước"
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const queryClient = useQueryClient();
  const [isBookmarked, setIsBookmarked] = useState(
    () => bookmarkedPostIds?.includes(post._id) ?? false
  );

  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ── EDIT POST MUTATION ──────────────────────────────────────────────────
  const { mutate: updatePost, isPending: isUpdating } = useMutation({
    mutationFn: async (newContent: string) => {
      const res = await fetch(`/api/posts/${post._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Cập nhật thất bại");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Đã cập nhật bài viết ✅");
      setIsEditing(false);
      setShowMenu(false);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["user-posts"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // ── DELETE POST MUTATION ────────────────────────────────────────────────
  const { mutate: deletePost, isPending: isDeleting } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/posts/${post._id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Xóa bài viết thất bại");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Đã xóa bài viết 🗑️");
      setShowDeleteConfirm(false);
      setShowMenu(false);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["user-posts"] });
      queryClient.invalidateQueries({ queryKey: ["saved-posts"] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
  // Thêm sau khai báo state, trong component PostCard

  // ── LIKE MUTATION với Optimistic Updates ────────────────────────────────
  const { mutate: toggleLike } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/posts/${post._id}/like`, { method: "POST" });
      if (!res.ok) throw new Error("Thao tác thất bại");
      return res.json();
    },

    // onMutate: Chạy NGAY KHI gọi mutate() — TRƯỚC khi API trả về
    onMutate: async () => {
      // 1. Hủy các query đang chạy để tránh ghi đè optimistic update
      await queryClient.cancelQueries({ queryKey: ["posts"] });

      // 2. Lưu lại trạng thái cache HIỆN TẠI để rollback nếu cần
      const previousPosts = queryClient.getQueryData(["posts"]);

      // 3. Cập nhật cache ngay lập tức (không chờ API)
      queryClient.setQueryData(["posts"], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          posts: old.posts.map((p: PostData) => {
            if (p._id !== post._id) return p;

            const isLiked = p.likes.includes(currentUserId ?? "");
            return {
              ...p,
              likes: isLiked
                ? p.likes.filter((id) => id !== currentUserId)  // unlike
                : [...p.likes, currentUserId ?? ""],             // like
            };
          }),
        };
      });

      // 4. Trả về context để dùng trong onError
      return { previousPosts };
    },

    // onError: API thất bại → khôi phục lại cache cũ
    onError: (err, variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(["posts"], context.previousPosts);
      }
      toast.error("Thao tác thất bại");
    },

    // onSettled: Luôn chạy sau cùng — đồng bộ lại với server
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });

  // ── BOOKMARK MUTATION ────────────────────────────────────────────────────
  const { mutate: toggleBookmark } = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/posts/${post._id}/bookmark`, { method: "POST" });
      if (!res.ok) throw new Error("Thao tác thất bại");
      return res.json();
    },
    onMutate: () => {
      setIsBookmarked((prev) => !prev);
    },
    onSuccess: (result) => {
      setIsBookmarked(result.isBookmarked);
      toast.success(result.isBookmarked ? "Đã lưu bài viết 🔖" : "Đã bỏ lưu");
      queryClient.invalidateQueries({ queryKey: ["saved-posts"] });
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
    onError: () => {
      setIsBookmarked((prev) => !prev); // rollback
      toast.error("Thao tác thất bại");
    },
  });
  // Comment query — chỉ fetch khi showComments = true
  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ["comments", post._id],
    queryFn: async () => {
      const res = await fetch(`/api/posts/${post._id}/comments`);
      if (!res.ok) throw new Error("Không thể tải bình luận");
      return res.json() as Promise<{ comments: CommentData[] }>;
    },
    enabled: showComments,   // ← Chỉ gọi API khi user mở comment section
    staleTime: 30 * 1000,
  });

  // Comment mutation
  const { mutate: submitComment, isPending: isSubmitting } = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch(`/api/posts/${post._id}/comments`, {
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
      setCommentInput("");    // xóa input
      // Làm mới danh sách comment của bài này
      queryClient.invalidateQueries({ queryKey: ["comments", post._id] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });


  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,  // Thêm "trước" vào cuối
    locale: vi,       // Tiếng Việt
  });

  return (
    <div className="rounded-2xl border border-white/10 p-5 mb-3 transition-all hover:border-white/20" style={{ background: "rgba(255,255,255,0.04)" }}>
      {/* Header: Avatar + tên + thời gian */}
      <div className="flex items-start justify-between mb-4">
        <Link href={`/user/${post.user.username}`} className="flex items-center gap-3 group">
          {/* Avatar: hiện ảnh nếu có, ngược lại dùng chữ đầu */}
          {post.user.avatar ? (
            <img
              src={post.user.avatar}
              alt={post.user.username}
              className="w-10 h-10 rounded-full object-cover group-hover:opacity-90 transition-opacity"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm group-hover:opacity-90 transition-opacity">
              {post.user.username?.[0]?.toUpperCase()}
            </div>
          )}

          <div>
            <p className="text-white font-semibold text-sm group-hover:text-purple-300 transition-colors">
              @{post.user.username}
            </p>
            <p className="text-white/40 text-xs">{timeAgo}</p>
          </div>
        </Link>
        {currentUserId && post.user._id !== currentUserId && (
          <FollowButton
            targetUserId={post.user._id}
            isFollowing={(currentUserFollowing ?? []).includes(post.user._id)}
            currentUserId={currentUserId}
          />
        )}

        {/* More options dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowMenu((prev) => !prev)}
            className="text-white/30 hover:text-white/70 transition-colors p-1.5 rounded-lg hover:bg-white/5"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div
              className="absolute right-0 top-8 z-30 w-44 rounded-xl border border-white/10 bg-[#121222] shadow-2xl p-1 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
            >
              {currentUserId && post.user._id === currentUserId ? (
                <>
                  <button
                    onClick={() => {
                      setEditContent(post.content);
                      setIsEditing(true);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Chỉnh sửa bài viết</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(true);
                      setShowMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                    <span>Xóa bài viết</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/post/${post._id}`);
                    toast.success("Đã sao chép liên kết bài viết 📋");
                    setShowMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Sao chép liên kết</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Nội dung bài viết (Chế độ Xem hoặc Chỉnh sửa) */}
      {isEditing ? (
        <div className="mb-4 space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            rows={3}
            className="w-full bg-white/5 border border-purple-500/40 rounded-xl p-3 text-white text-sm placeholder:text-white/30 outline-none focus:border-purple-500 transition-colors resize-none"
          />
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => setIsEditing(false)}
              disabled={isUpdating}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/10 text-white/60 hover:text-white text-xs transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Hủy
            </button>
            <button
              onClick={() => updatePost(editContent)}
              disabled={isUpdating || !editContent.trim()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors disabled:opacity-40"
            >
              {isUpdating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              Lưu thay đổi
            </button>
          </div>
        </div>
      ) : (
        <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap mb-4">
          {post.content}
        </p>
      )}

      {/* Ảnh đính kèm (nếu có) */}
      {(post.images ?? []).length > 0 && (
        <div
          className={`grid gap-1.5 mb-4 rounded-xl overflow-hidden ${post.images.length === 1
            ? "grid-cols-1"
            : post.images.length === 2
              ? "grid-cols-2"
              : post.images.length === 3
                ? "grid-cols-2"          // 3 ảnh: 2 cột, ảnh đầu chiếm cả hàng
                : "grid-cols-2"          // 4 ảnh: lưới 2x2
            }`}
        >
          {post.images.map((img, i) => (
            <div
              key={i}
              className={`relative overflow-hidden rounded-lg ${post.images.length === 3 && i === 0
                ? "col-span-2 aspect-video"    // Ảnh đầu tiên của 3 ảnh → full width
                : "aspect-square"
                }`}
            >
              <img
                src={img}
                alt={`Ảnh ${i + 1}`}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      )}

      {/* Separator */}
      <div className="h-px bg-white/8 mb-3" />

      {/* Actions: Like / Comment / Share */}
      <div className="flex items-center gap-1">
        {/* Like */}
        <button
          onClick={() => currentUserId && toggleLike()}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all group ${post.likes.includes(currentUserId ?? "")
              ? "text-red-400 bg-red-500/10"          // Đã like → đỏ
              : "text-white/50 hover:text-red-400 hover:bg-red-500/10"
            }`}
        >
          <Heart
            className={`w-4 h-4 transition-all group-hover:scale-125 ${post.likes.includes(currentUserId ?? "") ? "fill-red-400" : ""
              }`}
          />
          <span>{post.likes.length > 0 ? post.likes.length : ""}</span>
          <span>Thích</span>
        </button>

        {/* Comment */}
        <button
          onClick={() => setShowComments((prev) => !prev)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all group ${
            showComments
              ? "text-blue-400 bg-blue-500/10"
              : "text-white/50 hover:text-blue-400 hover:bg-blue-500/10"
          }`}
        >
          <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
          {commentsData?.comments?.length ? (
            <span>{commentsData.comments.length}</span>
          ) : null}
          <span>Bình luận</span>
        </button>

        {/* Share */}
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/50 hover:text-green-400 hover:bg-green-500/10 text-xs transition-all group">
          <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>Chia sẻ</span>
        </button>

        {/* Bookmark */}
        {currentUserId && (
          <button
            onClick={() => toggleBookmark()}
            className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all group ${
              isBookmarked
                ? "text-purple-400 bg-purple-500/10"
                : "text-white/50 hover:text-purple-400 hover:bg-purple-500/10"
            }`}
          >
            <Bookmark
              className={`w-4 h-4 group-hover:scale-110 transition-transform ${
                isBookmarked ? "fill-purple-400" : ""
              }`}
            />
          </button>
        )}
      </div>
      {/* 💬 Comment Section — xổ xuống khi click */}
      {showComments && (
        <div className="mt-3 pt-3 border-t border-white/8 space-y-3">
          {/* Input gửi comment */}
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {currentUserId ? "U" : "?"}
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
                className="flex-1 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-white text-xs placeholder:text-white/30 outline-none focus:border-purple-500/50 transition-colors"
              />
              <button
                onClick={() => commentInput.trim() && submitComment(commentInput)}
                disabled={isSubmitting || !commentInput.trim()}
                className="px-3 py-1.5 rounded-full bg-purple-600/30 text-purple-300 text-xs hover:bg-purple-600/50 transition-all disabled:opacity-40"
              >
                {isSubmitting ? "..." : "Gửi"}
              </button>
            </div>
          </div>
          {/* Danh sách comment */}
          {commentsLoading && (
            <p className="text-white/30 text-xs text-center py-2">Đang tải...</p>
          )}
          {commentsData?.comments.map((comment) => (
            <div key={comment._id} className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                {comment.user.username[0].toUpperCase()}
              </div>
              <div className="flex-1 bg-white/4 rounded-xl px-3 py-2">
                <p className="text-white text-xs font-medium">@{comment.user.username}</p>
                <p className="text-white/80 text-xs mt-0.5">{comment.content}</p>
              </div>
            </div>
          ))}
          {commentsData?.comments.length === 0 && (
            <p className="text-white/30 text-xs text-center py-1">Chưa có bình luận nào</p>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#121222] p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-white text-sm font-semibold">Xóa bài viết?</h3>
                <p className="text-white/40 text-xs mt-0.5">Hành động này không thể hoàn tác.</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-white/10 text-white/60 hover:text-white text-xs transition-all"
              >
                Hủy
              </button>
              <button
                onClick={() => deletePost()}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-all disabled:opacity-40"
              >
                {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
