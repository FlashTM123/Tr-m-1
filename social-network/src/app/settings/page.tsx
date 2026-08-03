"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useSession, signOut } from "next-auth/react";
import {
  ArrowLeft,
  Camera,
  Loader2,
  Save,
  LogOut,
  AtSign,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useUploadThing } from "@/lib/uploadthing";

interface UserProfile {
  username: string;
  email: string;
  avatar: string;
  bio: string;
}

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ username: "", bio: "", avatar: "" });
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [initialized, setInitialized] = useState(false);

  // Fetch current profile
  const { isLoading, data: profileData } = useQuery<{ user: UserProfile }>({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Không thể tải thông tin");
      return res.json();
    },
  });

  // Init form when data loads
  useEffect(() => {
    if (profileData?.user && !initialized) {
      setForm({
        username: profileData.user.username ?? "",
        bio: profileData.user.bio ?? "",
        avatar: profileData.user.avatar ?? "",
      });
      setAvatarPreview(profileData.user.avatar ?? "");
      setInitialized(true);
    }
  }, [profileData, initialized]);

  // Upload avatar
  const { startUpload, isUploading } = useUploadThing("storyUploader", {
    onUploadError: (err) => { toast.error(`Upload thất bại: ${err.message}`); },
  });

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);

    // Upload
    const uploaded = await startUpload([file]);
    if (uploaded?.[0]?.url) {
      setForm((prev) => ({ ...prev, avatar: uploaded[0].url }));
      toast.success("Đã upload ảnh đại diện ✅");
    }
    e.target.value = "";
  };

  // Save mutation
  const { mutate: saveProfile, isPending } = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          bio: form.bio,
          avatar: form.avatar,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Cập nhật thất bại");
      }
      return res.json();
    },
    onSuccess: async () => {
      toast.success("Đã cập nhật hồ sơ! 🎉");
      await updateSession({ username: form.username });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
      </div>
    );
  }

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
        <p className="text-white text-sm font-semibold flex-1">Cài đặt hồ sơ</p>
        <button
          onClick={() => saveProfile()}
          disabled={isPending || isUploading || !initialized}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-all disabled:opacity-40"
        >
          {isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          Lưu
        </button>
      </div>

      <div className="pt-14 max-w-xl mx-auto px-4 py-8">
        {/* Avatar section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white text-4xl font-bold">
                  {form.username?.[0]?.toUpperCase() ?? "U"}
                </span>
              )}
            </div>
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={isUploading}
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-purple-600 hover:bg-purple-500 border-2 border-[#0a0a14] flex items-center justify-center text-white transition-all"
            >
              {isUploading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5" />
              )}
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
          <p className="text-white/40 text-xs mt-4">Nhấn vào icon máy ảnh để đổi avatar</p>
        </div>

        {/* Form fields */}
        <div className="space-y-5">
          {/* Email (readonly) */}
          <div
            className="rounded-2xl border border-white/8 p-4"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <p className="text-white/40 text-xs font-medium mb-3">Thông tin tài khoản</p>
            <div className="space-y-1">
              <label className="text-white/60 text-xs">Email</label>
              <p className="text-white/40 text-sm">{session?.user?.email}</p>
            </div>
          </div>

          {/* Username */}
          <div
            className="rounded-2xl border border-white/8 p-4"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <label className="text-white/60 text-xs font-medium flex items-center gap-1.5 mb-3">
              <AtSign className="w-3 h-3" /> Tên người dùng
            </label>
            <input
              value={form.username}
              onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
              placeholder="username"
              maxLength={30}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/30 outline-none focus:border-purple-500/60 transition-colors"
            />
            <p className="text-white/25 text-xs mt-2">3–30 ký tự, không có khoảng trắng</p>
          </div>

          {/* Bio */}
          <div
            className="rounded-2xl border border-white/8 p-4"
            style={{ background: "rgba(255,255,255,0.03)" }}
          >
            <label className="text-white/60 text-xs font-medium flex items-center gap-1.5 mb-3">
              <FileText className="w-3 h-3" /> Giới thiệu bản thân
            </label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((prev) => ({ ...prev, bio: e.target.value }))}
              placeholder="Kể một chút về bản thân bạn..."
              rows={4}
              maxLength={160}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/30 outline-none focus:border-purple-500/60 transition-colors resize-none"
            />
            <p className="text-white/25 text-xs mt-1 text-right">{form.bio.length}/160</p>
          </div>

          {/* Danger zone */}
          <div
            className="rounded-2xl border border-red-500/20 p-4"
            style={{ background: "rgba(239,68,68,0.04)" }}
          >
            <p className="text-red-400/70 text-xs font-medium mb-3">Vùng nguy hiểm</p>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 text-red-400 text-sm hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất khỏi tài khoản
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
