"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import type { GroupedStories, StoryData } from "./StoryBar";

// ─── Constants ───────────────────────────────────────────
const IMAGE_DURATION = 5000;  // 5 giây cho ảnh
const VIDEO_DURATION = 15000; // 15 giây tối đa cho video

// ─── Props ───────────────────────────────────────────────
interface StoryViewerProps {
  groups: GroupedStories[];
  initialGroupIndex: number;
  currentUserId?: string;
  onClose: () => void;
}

// ─── Component ───────────────────────────────────────────
export default function StoryViewer({
  groups,
  initialGroupIndex,
  currentUserId,
  onClose,
}: StoryViewerProps) {
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(Date.now());
  const elapsedRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const queryClient = useQueryClient();

  const currentGroup = groups[groupIndex];
  const currentStory: StoryData = currentGroup.stories[storyIndex];
  const totalStories = currentGroup.stories.length;
  const DURATION = currentStory.mediaType === "video" ? VIDEO_DURATION : IMAGE_DURATION;

  // ── Mark as viewed ──────────────────────────────────────
  const { mutate: markViewed } = useMutation({
    mutationFn: async (storyId: string) => {
      await fetch(`/api/stories/${storyId}`, { method: "PATCH" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stories"] });
    },
  });

  // ── Delete story ────────────────────────────────────────
  const { mutate: deleteStory } = useMutation({
    mutationFn: async (storyId: string) => {
      const res = await fetch(`/api/stories/${storyId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Xóa thất bại");
    },
    onSuccess: () => {
      toast.success("Đã xóa story");
      queryClient.invalidateQueries({ queryKey: ["stories"] });
      onClose();
    },
    onError: () => toast.error("Không thể xóa story"),
  });

  // ── Navigation helpers ──────────────────────────────────
  const goNext = useCallback(() => {
    if (storyIndex < totalStories - 1) {
      // Tiếp theo trong cùng group
      setStoryIndex((i) => i + 1);
      setProgress(0);
      elapsedRef.current = 0;
    } else if (groupIndex < groups.length - 1) {
      // Sang group tiếp theo
      setGroupIndex((g) => g + 1);
      setStoryIndex(0);
      setProgress(0);
      elapsedRef.current = 0;
    } else {
      onClose(); // Hết tất cả
    }
  }, [storyIndex, totalStories, groupIndex, groups.length, onClose]);

  const goPrev = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex((i) => i - 1);
    } else if (groupIndex > 0) {
      setGroupIndex((g) => g - 1);
      setStoryIndex(0);
    }
    setProgress(0);
    elapsedRef.current = 0;
  }, [storyIndex, groupIndex]);

  // ── Auto-advance progress bar ────────────────────────────
  useEffect(() => {
    startTimeRef.current = Date.now();
    setProgress(0);
    elapsedRef.current = 0;

    // Mark current story as viewed
    if (currentUserId) {
      markViewed(currentStory._id);
    }

    const TICK = 50; // ms per tick
    progressInterval.current = setInterval(() => {
      if (isPaused) return;
      elapsedRef.current += TICK;
      const pct = Math.min((elapsedRef.current / DURATION) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(progressInterval.current!);
        goNext();
      }
    }, TICK);

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupIndex, storyIndex]);

  // ── Keyboard navigation ──────────────────────────────────
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft")  goPrev();
      if (e.key === "Escape")     onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, onClose]);

  const isOwn = currentUserId === currentGroup.user._id;

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      style={{ backdropFilter: "blur(4px)" }}
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* ── Story container (max 430px wide, full height) ── */}
      <div className="relative w-full max-w-sm h-full max-h-[780px] flex flex-col">

        {/* ── Progress bars ── */}
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 px-3 pt-3">
          {currentGroup.stories.map((s: StoryData, i: number) => (
            <div key={s._id} className="flex-1 h-[3px] rounded-full bg-white/25 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width:
                    i < storyIndex ? "100%"
                    : i === storyIndex ? `${progress}%`
                    : "0%",
                }}
              />
            </div>
          ))}
        </div>

        {/* ── Header ── */}
        <div className="absolute top-8 left-0 right-0 z-20 flex items-center gap-2.5 px-3">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-xl overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 border border-white/20">
            {currentGroup.user.avatar ? (
              <img src={currentGroup.user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-xs font-bold">
                {currentGroup.user.username[0].toUpperCase()}
              </span>
            )}
          </div>

          {/* Username + time */}
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold">@{currentGroup.user.username}</p>
            <p className="text-white/50 text-[10px]">
              {formatDistanceToNow(new Date(currentStory.createdAt), { addSuffix: true, locale: vi })}
            </p>
          </div>

          {/* Delete button (chỉ hiện nếu là story của mình) */}
          {isOwn && (
            <button
              onClick={(e) => { e.stopPropagation(); deleteStory(currentStory._id); }}
              className="w-7 h-7 rounded-lg bg-black/50 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Close */}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-black/50 flex items-center justify-center text-white/70 hover:text-white transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── Media ── */}
        <div className="flex-1 relative rounded-2xl overflow-hidden bg-black">
          {currentStory.mediaType === "video" ? (
            <video
              ref={videoRef}
              src={currentStory.mediaUrl}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-contain"
              onEnded={goNext}
            />
          ) : (
            <img
              src={currentStory.mediaUrl}
              alt=""
              className="w-full h-full object-contain"
              draggable={false}
            />
          )}

          {/* Caption overlay */}
          {currentStory.caption && (
            <div
              className="absolute bottom-0 left-0 right-0 px-4 py-5"
              style={{
                background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)",
              }}
            >
              <p className="text-white text-sm text-center leading-relaxed">
                {currentStory.caption}
              </p>
            </div>
          )}

          {/* ── Tap zones (left/right navigation) ── */}
          <button
            className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
            onClick={(e) => { e.stopPropagation(); goPrev(); }}
          />
          <button
            className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
            onClick={(e) => { e.stopPropagation(); goNext(); }}
          />
        </div>

        {/* ── Viewer count (chỉ hiện với story của mình) ── */}
        {isOwn && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/60 rounded-full px-3 py-1.5">
            <span className="text-white/60 text-xs">👁</span>
            <span className="text-white text-xs font-medium">
              {currentStory.viewers.length} lượt xem
            </span>
          </div>
        )}
      </div>

      {/* ── External prev/next arrows (bên ngoài story card) ── */}
      {groupIndex > 0 && (
        <button
          onClick={goPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all backdrop-blur-sm"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {groupIndex < groups.length - 1 && (
        <button
          onClick={goNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all backdrop-blur-sm"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
