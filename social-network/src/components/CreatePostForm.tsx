// src/components/CreatePostForm.tsx
"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImageIcon, Send, X } from "lucide-react";

export default function CreatePostForm() {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  const [previews, setPreviews] = useState<string[]>([]); // Base64 preview URLs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const { mutate: createPost, isPending } = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Đăng bài thất bại");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Đã đăng bài! ✨");
      setContent("");
      setPreviews([]);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Xử lý chọn ảnh — tạo preview base64 để hiện lên UI
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    // Giới hạn 4 ảnh
    const allowed = files.slice(0, 4);
    const readers = allowed.map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        })
    );

    Promise.all(readers).then(setPreviews);
    // Reset input để có thể chọn lại cùng file
    e.target.value = "";
  };

  const removePreview = (index: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!content.trim() && previews.length === 0) return;
    createPost(content);
  };

  if (!session) return null;

  return (
    <div className="rounded-2xl border border-white/10 p-5 mb-4" style={{ background: "rgba(255,255,255,0.05)" }}>
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {session.user?.username?.[0]?.toUpperCase() ?? "U"}
        </div>

        <div className="flex-1 space-y-3">
          {/* Textarea */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`${session.user?.username} ơi, bạn đang nghĩ gì vậy?`}
            rows={3}
            className="w-full bg-transparent text-white placeholder:text-white/30 text-sm resize-none outline-none border-b border-white/10 pb-2 focus:border-purple-500/50 transition-colors"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleSubmit();
            }}
          />

          {/* Image previews */}
          {previews.length > 0 && (
            <div className={`grid gap-2 ${previews.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {previews.map((src, i) => (
                <div key={i} className="relative group rounded-xl overflow-hidden aspect-video">
                  <img src={src} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => removePreview(i)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-white/40 hover:text-purple-400 text-sm transition-colors"
            >
              <ImageIcon className="w-4 h-4" />
              <span>Ảnh {previews.length > 0 && `(${previews.length})`}</span>
            </button>

            <button
              onClick={handleSubmit}
              disabled={(!content.trim() && previews.length === 0) || isPending}
              className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              {isPending ? "Đang đăng..." : "Đăng bài"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
