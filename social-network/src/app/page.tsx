"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import CreatePostForm from "@/components/CreatePostForm";
import PostCard, { PostData } from "@/components/PostCard";
import StoryBar from "@/components/StoryBar";
import {
  Loader2, Home, Search, Bell, User, Users, Bookmark,
  Settings, TrendingUp, LogOut, LogIn, UserPlus, UserMinus,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

// Nav items — active sẽ được xác định dynamically theo pathname
const navItems = [
  { icon: Home, label: "Trang chủ", href: "/" },
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

// Suggestion user type
interface SuggestionUser {
  _id: string;
  username: string;
  avatar: string;
  bio: string;
  followersCount: number;
}

export default function HomePage() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"for-you" | "following">("for-you");
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});

  // Posts query — dành cho bạn (tất cả hoặc theo following)
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["posts"],
    queryFn: async () => {
      const res = await fetch("/api/posts");
      if (!res.ok) throw new Error("Không thể tải bài viết");
      return res.json() as Promise<{
        posts: PostData[];
        currentUserFollowing: string[];
      }>;
    },
    staleTime: 30 * 1000,
  });

  // Posts đang theo dõi
  const { data: followingPostsData, isLoading: isLoadingFollowing } = useQuery({
    queryKey: ["posts-following"],
    queryFn: async () => {
      const res = await fetch("/api/posts?feed=following");
      if (!res.ok) throw new Error("Không thể tải bài viết");
      return res.json() as Promise<{
        posts: PostData[];
        currentUserFollowing: string[];
      }>;
    },
    enabled: activeTab === "following" && !!session,
    staleTime: 30 * 1000,
  });

  // User bookmarks (để highlight bookmark state trong PostCard)
  const { data: bookmarksData } = useQuery<{ posts: PostData[] }>({
    queryKey: ["saved-posts"],
    queryFn: async () => {
      const res = await fetch("/api/user/bookmarks");
      if (!res.ok) return { posts: [] };
      return res.json();
    },
    enabled: !!session,
    staleTime: 60_000,
  });
  const bookmarkedPostIds = bookmarksData?.posts.map((p) => p._id) ?? [];

  // Suggestions from API
  const { data: suggestionsData } = useQuery<{ suggestions: SuggestionUser[] }>({
    queryKey: ["suggestions"],
    queryFn: async () => {
      const res = await fetch("/api/user/suggestions");
      if (!res.ok) return { suggestions: [] };
      return res.json();
    },
    staleTime: 120_000,
  });

  // Notifications unread count
  const { data: notifData } = useQuery<{ unreadCount: number }>({
    queryKey: ["notifications-count"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) return { unreadCount: 0 };
      return res.json();
    },
    enabled: !!session,
    // Không cần polling vì SSE đã handle real-time
    staleTime: 5 * 60_000,
  });
  const unreadCount = notifData?.unreadCount ?? 0;

  // Follow suggestion mutation
  const { mutate: followSuggestion } = useMutation({
    mutationFn: async (userId: string) => {
      const res = await fetch("/api/follow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId }),
      });
      if (!res.ok) throw new Error("Thao tác thất bại");
      return res.json();
    },
    onMutate: (userId) => {
      setFollowingStates((prev) => ({ ...prev, [userId]: !prev[userId] }));
    },
    onSuccess: (result, userId) => {
      setFollowingStates((prev) => ({ ...prev, [userId]: result.isFollowing }));
      toast.success(result.isFollowing ? "Đã follow! 🎉" : "Đã unfollow");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      queryClient.invalidateQueries({ queryKey: ["suggestions"] });
    },
    onError: (_, userId) => {
      setFollowingStates((prev) => ({ ...prev, [userId]: !prev[userId] }));
      toast.error("Thao tác thất bại");
    },
  });

  const suggestions = suggestionsData?.suggestions ?? [];

  // Chọn posts theo tab
  const displayPosts = activeTab === "following"
    ? (followingPostsData?.posts ?? [])
    : (data?.posts ?? []);
  const displayLoading = activeTab === "following" ? isLoadingFollowing : isLoading;

  return (
    <div className="min-h-screen bg-[#0a0a14]">
      {/* Top navbar - mobile */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 border-b border-white/8 flex items-center px-4 gap-3" style={{ background: "rgba(10,10,20,0.9)", backdropFilter: "blur(12px)" }}>
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
          <span className="text-white text-xs font-bold">SN</span>
        </div>
        <span className="text-white font-semibold text-sm">Social Network</span>

        {/* Notification badge mobile */}
        {session && unreadCount > 0 && (
          <Link href="/notifications" className="ml-auto relative">
            <Bell className="w-5 h-5 text-white/60" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-600 text-white text-[9px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </Link>
        )}
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
            {navItems.map(({ icon: Icon, label, href }) => {
              const targetHref = label === "Trang cá nhân" && session?.user?.username
                ? `/user/${session.user.username}`
                : href;
              const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
              return (
                <Link key={label} href={targetHref}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${isActive
                    ? "bg-purple-600/20 text-purple-400"
                    : "text-white/50 hover:text-white hover:bg-white/6"
                    }`}>
                  <Icon className={`w-5 h-5 transition-transform group-hover:scale-110 ${isActive ? "text-purple-400" : ""}`} />
                  {label}
                  {/* Notification badge on Bell icon */}
                  {label === "Thông báo" && unreadCount > 0 && (
                    <span className="ml-auto px-1.5 py-0.5 rounded-full bg-purple-600 text-white text-[9px] font-bold min-w-[18px] text-center">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                  {isActive && label !== "Thông báo" && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-purple-400" />}
                </Link>
              );
            })}
          </nav>

          {/* User info or Login/Register */}
          {session?.user ? (
            <div className="mt-4 rounded-xl border border-white/8 overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
              <Link href={`/user/${session.user.username}`} className="flex items-center gap-3 p-3 hover:bg-white/4 transition-colors">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {session.user.username?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-medium truncate">@{session.user.username}</p>
                  <p className="text-white/40 text-xs truncate">{session.user.email}</p>
                </div>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all border-t border-white/6"
              >
                <LogOut className="w-4 h-4" />
                Đăng xuất
              </button>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-purple-500/20 overflow-hidden" style={{ background: "rgba(139,92,246,0.06)" }}>
              <div className="px-3 pt-3 pb-2">
                <p className="text-white/70 text-xs font-medium mb-1">Tham gia cộng đồng</p>
                <p className="text-white/30 text-xs">Đăng nhập để đăng bài, like và follow bạn bè</p>
              </div>
              <div className="p-3 pt-1 flex flex-col gap-2">
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-all"
                >
                  <LogIn className="w-4 h-4" />
                  Đăng nhập
                </Link>
                <Link
                  href="/register"
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-white/15 hover:bg-white/6 text-white/70 hover:text-white text-sm font-medium transition-all"
                >
                  <UserPlus className="w-4 h-4" />
                  Đăng ký
                </Link>
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

            {/* Story Bar */}
            <StoryBar />

            {/* Create post */}
            <CreatePostForm />

            {/* Feed tabs */}
            <div className="flex gap-1 mb-4 p-1 rounded-xl border border-white/8" style={{ background: "rgba(255,255,255,0.03)" }}>
              {[
                { key: "for-you", label: "Dành cho bạn" },
                { key: "following", label: "Đang theo dõi" },
              ].map(({ key, label }) => (
                <button key={key}
                  onClick={() => setActiveTab(key as "for-you" | "following")}
                  className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === key
                    ? "bg-purple-600/25 text-purple-300"
                    : "text-white/40 hover:text-white/70"
                    }`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Following tab - chưa login */}
            {activeTab === "following" && !session && (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <UserPlus className="w-10 h-10 text-white/20" />
                <p className="text-white/40 text-sm">Đăng nhập để xem bài viết từ người bạn theo dõi</p>
                <Link href="/login" className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm transition-all">
                  Đăng nhập
                </Link>
              </div>
            )}

            {/* Feed prompt for unauthenticated users */}
            {!session && activeTab === "for-you" && (
              <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-xl border border-purple-500/25" style={{ background: "rgba(139,92,246,0.08)" }}>
                <div className="w-8 h-8 rounded-lg bg-purple-600/30 flex items-center justify-center shrink-0">
                  <UserPlus className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-xs font-medium">Đăng nhập để tương tác</p>
                  <p className="text-white/40 text-xs">Like, comment và follow mọi người</p>
                </div>
                <Link href="/login" className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-all shrink-0">
                  Đăng nhập
                </Link>
              </div>
            )}

            {/* Following tab — no one followed yet */}
            {activeTab === "following" && session && !isLoadingFollowing && followingPostsData?.posts.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-7 h-7 text-white/20" />
                </div>
                <p className="text-white/40 text-sm font-medium">Chưa có bài viết từ người bạn theo dõi</p>
                <p className="text-white/20 text-xs mt-1">Hãy follow thêm người để xem bài viết của họ</p>
                <Link href="/search" className="inline-block mt-4 px-4 py-2 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400 text-sm hover:bg-purple-600/30 transition-all">
                  Tìm người để follow
                </Link>
              </div>
            )}

            {/* Posts loading */}
            {displayLoading && (activeTab === "for-you" || session) && (
              <div className="flex flex-col items-center gap-3 py-16">
                <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                <p className="text-white/30 text-sm">Đang tải bài viết...</p>
              </div>
            )}

            {isError && (
              <div className="text-center py-12">
                <p className="text-red-400 text-sm">{(error as Error).message}</p>
              </div>
            )}

            {!displayLoading && activeTab === "for-you" && data?.posts.length === 0 && (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="w-7 h-7 text-white/20" />
                </div>
                <p className="text-white/40 text-sm font-medium">Chưa có bài viết nào</p>
                <p className="text-white/20 text-xs mt-1">Hãy là người đầu tiên chia sẻ!</p>
              </div>
            )}

            <div className="space-y-3">
              {displayPosts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  currentUserId={session?.user?.id}
                  currentUserFollowing={data?.currentUserFollowing ?? []}
                  bookmarkedPostIds={bookmarkedPostIds}
                />
              ))}
            </div>
          </div>
        </main>

        {/* ── RIGHT SIDEBAR ── */}
        <aside className="hidden lg:block w-72 fixed right-0 h-screen py-6 px-4 border-l border-white/6 overflow-y-auto" style={{ left: "auto" }}>
          {/* Search */}
          <Link href="/search" className="block relative mb-6 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-hover:text-purple-400 transition-colors" />
            <div
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/10 text-white/30 text-sm cursor-pointer hover:border-purple-500/40 transition-all group-hover:text-purple-400"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              Tìm kiếm...
            </div>
          </Link>

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

          {/* Who to follow — từ API thực */}
          <div className="rounded-xl border border-white/8 overflow-hidden" style={{ background: "rgba(255,255,255,0.03)" }}>
            <div className="px-4 py-3 border-b border-white/6">
              <h3 className="text-white font-semibold text-sm">Gợi ý theo dõi</h3>
            </div>
            <div className="divide-y divide-white/6">
              {suggestions.length === 0 && (
                <p className="text-white/25 text-xs text-center py-4">Không có gợi ý</p>
              )}
              {suggestions.map((user) => {
                const isFollowing = followingStates[user._id] ?? false;
                return (
                  <div key={user._id} className="flex items-center gap-3 px-4 py-3">
                    <Link href={`/user/${user.username}`} className="shrink-0">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold">
                          {user.username[0].toUpperCase()}
                        </div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/user/${user.username}`}>
                        <p className="text-white text-xs font-medium hover:text-purple-300 transition-colors">@{user.username}</p>
                      </Link>
                      <p className="text-white/30 text-xs">{user.followersCount} followers</p>
                    </div>
                    {session && (
                      <button
                        onClick={() => followSuggestion(user._id)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                          isFollowing
                            ? "border border-white/20 text-white/50 hover:border-red-500/50 hover:text-red-400"
                            : "border border-purple-500/50 text-purple-400 hover:bg-purple-600/20"
                        }`}
                      >
                        {isFollowing ? "Đang theo dõi" : "Follow"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            {session && (
              <Link href="/search" className="block text-center text-purple-400 hover:text-purple-300 text-xs py-3 border-t border-white/6 transition-colors">
                Tìm kiếm thêm →
              </Link>
            )}
          </div>
        </aside>
      </div>

      {/* Bottom nav - mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-white/8 flex justify-around py-3 px-4" style={{ background: "rgba(10,10,20,0.95)", backdropFilter: "blur(12px)" }}>
        {navItems.slice(0, 5).map(({ icon: Icon, href, label }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          const targetHref = label === "Trang cá nhân" && session?.user?.username
            ? `/user/${session.user.username}`
            : href;
          return (
            <Link key={href} href={targetHref} className={`relative p-2 rounded-xl transition-all ${isActive ? "text-purple-400" : "text-white/40"}`}>
              <Icon className="w-5 h-5" />
              {/* Bell badge on mobile */}
              {label === "Thông báo" && unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-purple-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
