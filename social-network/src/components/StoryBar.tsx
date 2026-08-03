"use client";

import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUploadThing } from "@/lib/uploadthing";
import StoryViewer from "./StoryViewer";

// ─── Types ───────────────────────────────────────────────
export interface StoryData {
  _id: string;
  user: { _id: string; username: string; avatar: string };
  mediaUrl: string;
  mediaType: "image" | "video";
  caption: string;
  viewers: string[];
  expiresAt: string;
  createdAt: string;
}

export interface GroupedStories {
  user: StoryData["user"];
  stories: StoryData[];
  hasUnviewed: boolean;
}

// ─── Helper: group stories by user ───────────────────────
function groupStoriesByUser(stories: StoryData[], currentUserId?: string): GroupedStories[] {
  const map = new Map<string, GroupedStories>();
  for (const story of stories) {
    const uid = story.user._id;
    if (!map.has(uid)) {
      map.set(uid, { user: story.user, stories: [], hasUnviewed: false });
    }
    const group = map.get(uid)!;
    group.stories.push(story);
    if (currentUserId && !story.viewers.includes(currentUserId)) {
      group.hasUnviewed = true;
    }
  }
  return Array.from(map.values());
}

// ─── Component ───────────────────────────────────────────
export default function StoryBar() {
  const { data: session } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);

  // Fetch stories
  const { data, isLoading } = useQuery({
    queryKey: ["stories"],
    queryFn: async () => {
      const res = await fetch("/api/stories");
      if (!res.ok) throw new Error("Lỗi tải stories");
      return res.json() as Promise<{ stories: StoryData[] }>;
    },
    refetchInterval: 60_000, // refresh mỗi phút
  });

  // Upload to UploadThing
  const { startUpload, isUploading } = useUploadThing("storyUploader", {
    onUploadError: (err) => { toast.error(`Upload thất bại: ${err.message}`); },
  });

  // Create story mutation
  const { mutate: createStory } = useMutation({
    mutationFn: async ({ mediaUrl, mediaType }: { mediaUrl: string; mediaType: "image" | "video" }) => {
      const res = await fetch("/api/stories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaUrl, mediaType }),
      });
      if (!res.ok) throw new Error("Đăng story thất bại");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Đã đăng story! 🎉");
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  // Handle file select
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const uploaded = await startUpload([file]);
    if (uploaded?.[0]?.url) {
      createStory({ mediaUrl: uploaded[0].url, mediaType: isVideo ? "video" : "image" });
    }
    e.target.value = "";
  };

  const stories = data?.stories ?? [];
  const groups = groupStoriesByUser(stories, session?.user?.id);

  const openViewer = (index: number) => {
    setSelectedGroupIndex(index);
    setViewerOpen(true);
  };

  return (
    <>
      <div className="mb-4 rounded-2xl border border-white/8 px-4 py-3 overflow-x-auto" style={{ background: "rgba(255,255,255,0.03)" }}>
        <div className="flex gap-4 min-w-max">

          {/* ── Add Story button (chỉ hiện khi đã đăng nhập) ── */}
          {session && (
            <div className="flex flex-col items-center gap-1.5">
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="relative w-14 h-14 rounded-2xl border-2 border-dashed border-purple-500/50 hover:border-purple-400 bg-purple-500/8 hover:bg-purple-500/15 flex items-center justify-center transition-all group"
              >
                {isUploading ? (
                  <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                ) : (
                  <Plus className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
                )}
              </button>
              <span className="text-white/40 text-[10px] font-medium">Tạo story</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          )}

          {/* ── Loading skeleton ── */}
          {isLoading && Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <div className="w-14 h-14 rounded-2xl bg-white/8 animate-pulse" />
              <div className="w-10 h-2 rounded bg-white/8 animate-pulse" />
            </div>
          ))}

          {/* ── Story groups ── */}
          {groups.map((group, index) => (
            <div key={group.user._id} className="flex flex-col items-center gap-1.5">
              <button
                onClick={() => openViewer(index)}
                className="relative w-14 h-14"
              >
                {/* Gradient ring: tím nếu chưa xem, trắng mờ nếu đã xem */}
                <div className={`absolute inset-0 rounded-2xl p-[2px] ${
                  group.hasUnviewed
                    ? "bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-500"
                    : "bg-white/20"
                }`}>
                  <div className="w-full h-full rounded-[14px] overflow-hidden bg-[#0a0a14] flex items-center justify-center">
                    {group.user.avatar ? (
                      <img
                        src={group.user.avatar}
                        alt={group.user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white text-lg font-bold">
                        {group.user.username[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Story count badge */}
                {group.stories.length > 1 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-500 text-white text-[9px] font-bold flex items-center justify-center border border-[#0a0a14]">
                    {group.stories.length}
                  </div>
                )}
              </button>
              <span className="text-white/50 text-[10px] font-medium max-w-[56px] truncate text-center">
                {group.user.username}
              </span>
            </div>
          ))}

          {/* ── Empty state ── */}
          {!isLoading && groups.length === 0 && (
            <div className="flex items-center gap-2 py-1">
              <p className="text-white/25 text-xs">Chưa có story nào — hãy tạo cái đầu tiên! 📸</p>
            </div>
          )}
        </div>
      </div>

      {/* Story viewer */}
      {viewerOpen && groups.length > 0 && (
        <StoryViewer
          groups={groups}
          initialGroupIndex={selectedGroupIndex}
          onClose={() => setViewerOpen(false)}
          currentUserId={session?.user?.id}
        />
      )}
    </>
  );
}
