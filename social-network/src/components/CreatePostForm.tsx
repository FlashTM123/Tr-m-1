// src/components/CreatePostForm.tsx
"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImageIcon, Send, X, Loader2 } from "lucide-react";
import { useUploadThing } from "@/lib/uploadthing";

export default function CreatePostForm() {
  const { data: session } = useSession();
  const [content, setContent] = useState("");
  
  // imageUrls: Mảng URL thật từ Uploadthing Cloud (dùng để gửi lên API)
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  
  // previews: Base64 để hiển thị ngay trước khi upload xong
  const [previews, setPreviews] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // useUploadThing: Hook kết nối đến "postImageUploader" trong core.ts
  const { startUpload, isUploading } = useUploadThing("postImageUploader", {
    // Callback sau khi tất cả ảnh upload lên cloud thành công
    onClientUploadComplete: (res) => {
      const urls = res.map((file) => file.url);
      setImageUrls(urls);
      toast.success(`Đã upload ${urls.length} ảnh ✅`);
    },
    onUploadError: (error) => {
      toast.error(`Upload thất bại: ${error.message}`);
      setPreviews([]);
    },
  });

  // Mutation đăng bài — nhận cả content VÀ images
  const { mutate: createPost, isPending } = useMutation({
    mutationFn: async ({ content, images }: { content: string; images: string[] }) => {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, images }), // ← gửi cả images lên API
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
      setImageUrls([]);
      setPreviews([]);
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Xử lý chọn file → tạo preview base64 + bắt đầu upload lên Uploadthing
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const allowed = files.slice(0, 4); // Tối đa 4 ảnh

    // Tạo preview base64 để hiển thị ngay lập tức (trước khi upload xong)
    const readers = allowed.map(
      (file) =>
        new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        })
    );
    const base64s = await Promise.all(readers);
    setPreviews(base64s);

    // Bắt đầu upload thật lên Uploadthing Cloud
    // startUpload() chạy background, khi xong sẽ gọi onClientUploadComplete
    await startUpload(allowed);
    
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!content.trim() && imageUrls.length === 0) return;

    // Nếu user chọn ảnh nhưng chưa upload xong → chờ
    if (previews.length > 0 && imageUrls.length === 0 && isUploading) {
      toast.info("Đang upload ảnh, vui lòng chờ...");
      return;
    }

    createPost({ content, images: imageUrls });
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
                  
                  {/* Upload progress overlay */}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                  
                  {/* Remove button */}
                  {!isUploading && (
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  
                  {/* Uploaded checkmark */}
                  {!isUploading && imageUrls[i] && (
                    <div className="absolute bottom-1.5 right-1.5 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
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
              disabled={isUploading}
              className="flex items-center gap-1.5 text-white/40 hover:text-purple-400 text-sm transition-colors disabled:opacity-40"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
              <span>
                {isUploading ? "Đang upload..." : `Ảnh${previews.length > 0 ? ` (${previews.length})` : ""}`}
              </span>
            </button>

            <button
              onClick={handleSubmit}
              disabled={(!content.trim() && imageUrls.length === 0) || isPending || isUploading}
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
