"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import CreatePostForm from "@/components/CreatePostForm";
import PostCard, { PostData } from "@/components/PostCard";
import { Loader2, Home, Search, Bell, User, Users, Bookmark, Settings, TrendingUp } from "lucide-react";
import Link from "next/link";

const fetchPosts = async (): Promise<{ posts: PostData[] }> => {
  const res = await fetch("/api/posts");
  if (!res.ok) throw new Error("Không thể tải bài viết");
  return res.json();
};

const navItems = [
  { icon: Home, label: "Trang chủ", href: "/", active: true },
  { icon: Search, label: "Tìm kiếm", href: "/search" },
  { icon: Bell, label: "Thông báo", href: "/notifications" },
  { icon: Users, label: "Bạn bè", href: "/friends" },
  { icon: Bookmark, label: "Đã lưu", href: "/saved" },
  { icon: User, label: "Trang cá nhân", href: "/profile" },
  { icon: Settings, label: "Cài đặt", href: "/settings" },
];

const trendingTopics = [
  { tag: "#NextJS", posts: "2.4k bài" },
  { tag: "#MongoDB", posts: "1.8k bài" },
  { tag: "#TypeScript", posts: "3.1k bài" },
  { tag: "#React", posts: "5.2k bài" },
];

export default function HomePage() {
  const { data: session } = useSession();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
    staleTime: 30 * 1000,
  });

  return (
    <div className="min-h-screen bg-[#0a0a14]">
      {/* Top navbar - mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 border-b border-white/8 flex items-center px-4 gap-3" style={{ background: "rgba(10,10,20,0.9)", backdropFilter: "blur(12px)" }}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">SN</span>
        </div>
        <span className="text-white font-semibold text-sm">Social Network</span>
      </div>

      <div className="flex max-w-6xl mx-auto min-h-screen">

        {/* ── LEFT SIDEBAR ── */}
        <aside className="hidden lg:flex flex-col w-64 fixed h-screen py-6 px-4 border-r border-white/6">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 mb-8">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <span className="text-white text-sm font-bold">SN</span>
            </div>
            <span className="text-white font-bold text-lg">SocialNet</span>
          </div>

          {/* Nav items */}
          <nav className="flex-1 space-y-1">
            {navItems.map(({ icon: Icon, label, href, active }) => (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${active
                  ? "bg-purple-600/20 text-purple-400"
                  : "text-white/50 hover:text-white hover:bg-white/6"
                  }`}>
                <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${active ? "text-purple-400" : ""}`} />
                {label}
                {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400" />}
              </Link>
            ))}
          </nav>

          {/* User info at bottom */}
          {session?.user && (
            <div className="mt-4 p-3 rounded-xl border border-white/8 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.04)" }}>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {session.user.username?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="min-w-0">
                <p className="text-white text-sm font-medium truncate">@{session.user.username}</p>
                <p className="text-white/40 text-xs truncate">{session.user.email}</p>
              </div>
            </div>
          )}
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 lg:ml-64 lg:mr-72 min-h-screen pt-16 lg:pt-0">
          <div className="max-w-xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="mb-5 pb-4 border-b border-white/6">
              <h1 className="text-xl font-bold text-white">Bảng tin</h1>
              <p className="text-white/40 text-xs mt-0.5">Cập nhật mới nhất từ cộng đồng</p>
            </div>

            {/* Create post */}
            <CreatePostForm />

            {/* Feed tabs */}
            <div className="flex gap-1 mb-4 p-1 rounded-xl border border-white/8" style={{ background: "rgba(255,255,255,0.03)" }}>
              {["Dành cho bạn", "Đang theo dõi"].map((tab, i) => (
                <button key={tab}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${i === 0
                    ? "bg-purple-600/25 text-purple-300"
                    : "text-white/40 hover:text-white/70"
                    }`}>
                  {tab}
                </button>
              ))}
            </div>

            {/* Posts */}
            {isLoading && (
              <div className="flex flex-col items-center gap-3 py-16">
                <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                <p className="text-white/30 text-sm">Đang tải bài viết...</p>
              </div>
            )}

            {isError && (
              <div className="text-center py-12">
                <p className="text-red-400 text-sm">{error.message}</p>
              </div>
            )}

            {!isLoading && data?.posts.length === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-7 h-7 text-white/20" />
                </div>
                <p className="text-white/40 text-sm font-medium">Chưa có bài viết nào</p>
                <p className="text-white/20 text-xs mt-1">Hãy là người đầu tiên chia sẻ!</p>
              </div>
            )}

            <div className="space-y-3">
              {data?.posts.map((post) => (
                <PostCard key={post._id} post={post} />
              ))}
            </div>
          </div>
        </main>

        {/* ── RIGHT SIDEBAR ── */}
        <aside className="hidden lg:block w-72 fixed right-0 h-screen py-6 px-4 border-l border-white/6 overflow-y-auto" style={{ left: "auto" }}>
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              placeholder="Tìm kiếm..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/10 text-white text-sm placeholder:text-white/30 outline-none focus:border-purple-500/50 transition-all"
              style={{ background: "rgba(255,255,255,0.05)" }}
            />
          </div>

          {/* Trending */}
          <div className="rounded-xl border border-white/8 overflow-hidden mb-5" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="px-4 py-3 border-b border-white/6">
              <h3 className="text-white font-semibold text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                Trending
              </h3>
            </div>
            <div className="divide-y divide-white/6">
              {trendingTopics.map(({ tag, posts }) => (
                <button key={tag} className="w-full px-4 py-3 text-left hover:bg-white/4 transition-colors group">
                  <p className="text-purple-400 text-sm font-medium group-hover:text-purple-300">{tag}</p>
                  <p className="text-white/30 text-xs mt-0.5">{posts}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Who to follow */}
          <div className="rounded-xl border border-white/8 overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="px-4 py-3 border-b border-white/6">
              <h3 className="text-white font-semibold text-sm">Gợi ý theo dõi</h3>
            </div>
            <div className="divide-y divide-white/6">
              {["devuser", "coder99", "techgirl"].map((user) => (
                <div key={user} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {user[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium">@{user}</p>
                    <p className="text-white/30 text-xs">Suggested</p>
                  </div>
                  <button className="px-3 py-1 rounded-full text-xs font-medium border border-purple-500/50 text-purple-400 hover:bg-purple-600/20 transition-all">
                    Follow
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom nav - mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-white/8 flex justify-around py-3 px-4" style={{ background: "rgba(10,10,20,0.95)", backdropFilter: "blur(12px)" }}>
        {navItems.slice(0, 5).map(({ icon: Icon, href, active }) => (
          <Link key={href} href={href} className={`p-2 rounded-xl transition-all ${active ? "text-purple-400" : "text-white/40"}`}>
            <Icon className="w-5 h-5" />
          </Link>
        ))}
      </nav>
    </div>
  );
}
