// src/components/PostCard.tsx
"use client";

import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";   // Tiếng Việt
import { Heart, MessageCircle, Share2, MoreHorizontal } from "lucide-react";

// Kiểu dữ liệu của một Post từ API
export interface PostData {
  _id: string;
  content: string;
  images: string[];
  likes: string[];
  createdAt: string;
  user: {
    _id: string;
    username: string;
    avatar: string;
  };
}

interface PostCardProps {
  post: PostData;
}

export default function PostCard({ post }: PostCardProps) {
  // formatDistanceToNow: "5 phút trước", "2 giờ trước", "3 ngày trước"
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,  // Thêm "trước" vào cuối
    locale: vi,       // Tiếng Việt
  });

  return (
    <div className="rounded-2xl border border-white/10 p-5 mb-3 transition-all hover:border-white/20" style={{ background: "rgba(255,255,255,0.04)" }}>
      {/* Header: Avatar + tên + thời gian */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* Avatar: hiện ảnh nếu có, ngược lại dùng chữ đầu */}
          {post.user.avatar ? (
            <img
              src={post.user.avatar}
              alt={post.user.username}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {post.user.username?.[0]?.toUpperCase()}
            </div>
          )}

          <div>
            <p className="text-white font-semibold text-sm">
              @{post.user.username}
            </p>
            <p className="text-white/40 text-xs">{timeAgo}</p>
          </div>
        </div>

        {/* More options */}
        <button className="text-white/30 hover:text-white/70 transition-colors p-1 rounded-lg hover:bg-white/5">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Nội dung bài viết */}
      <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap mb-4">
        {post.content}
      </p>

      {/* Ảnh đính kèm (nếu có) */}
      {(post.images ?? []).length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4 rounded-xl overflow-hidden">
          {post.images.map((img, i) => (
            <img key={i} src={img} alt="" className="w-full object-cover aspect-video" />
          ))}
        </div>
      )}

      {/* Separator */}
      <div className="h-px bg-white/8 mb-3" />

      {/* Actions: Like / Comment / Share */}
      <div className="flex items-center gap-1">
        {/* Like */}
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-500/10 text-xs transition-all group">
          <Heart className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>{(post.likes ?? []).length > 0 ? post.likes.length : ""}</span>
          <span>Thích</span>
        </button>

        {/* Comment */}
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/50 hover:text-blue-400 hover:bg-blue-500/10 text-xs transition-all group">
          <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>Bình luận</span>
        </button>

        {/* Share */}
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white/50 hover:text-green-400 hover:bg-green-500/10 text-xs transition-all group ml-auto">
          <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span>Chia sẻ</span>
        </button>
      </div>
    </div>
  );
}
