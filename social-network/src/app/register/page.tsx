"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Eye, EyeOff, UserPlus } from "lucide-react";

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username phải có ít nhất 3 ký tự")
      .max(30, "Username tối đa 30 ký tự")
      .regex(/^[a-zA-Z0-9_]+$/, "Chỉ chứa chữ, số và dấu gạch dưới"),
    email: z.string().email("Email không hợp lệ"),
    password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: data.username,
          email: data.email,
          password: data.password,
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.message || "Đăng ký thất bại");
        return;
      }
      toast.success("Tạo tài khoản thành công! 🎉");
      setTimeout(() => router.push("/login"), 1200);
    } catch {
      toast.error("Lỗi kết nối, vui lòng thử lại");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0f0f1a]">
      {/* Ambient blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-indigo-500/20 blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30 mb-4">
            <UserPlus className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Tạo tài khoản</h1>
          <p className="text-sm text-white/50 mt-1">Tham gia cộng đồng ngay hôm nay</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/80">Username</label>
              <input
                placeholder="minhdz"
                className="w-full px-4 py-2.5 rounded-xl bg-white/8 border border-white/10 text-white placeholder:text-white/30 text-sm outline-none focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/20 transition-all"
                style={{ background: "rgba(255,255,255,0.06)" }}
                {...register("username")}
              />
              {errors.username && <p className="text-red-400 text-xs">{errors.username.message}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/80">Email</label>
              <input
                type="email"
                placeholder="minh@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-white/10 text-white placeholder:text-white/30 text-sm outline-none focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/20 transition-all"
                style={{ background: "rgba(255,255,255,0.06)" }}
                {...register("email")}
              />
              {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/80">Mật khẩu</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Tối thiểu 6 ký tự"
                  className="w-full px-4 py-2.5 pr-11 rounded-xl border border-white/10 text-white placeholder:text-white/30 text-sm outline-none focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                  {...register("password")}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white/80">Xác nhận mật khẩu</label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu"
                  className="w-full px-4 py-2.5 pr-11 rounded-xl border border-white/10 text-white placeholder:text-white/30 text-sm outline-none focus:border-purple-500/70 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  style={{ background: "rgba(255,255,255,0.06)" }}
                  {...register("confirmPassword")}
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80 transition-colors">
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-red-400 text-xs">{errors.confirmPassword.message}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-purple-500/25 transition-all duration-200 mt-2"
            >
              {isLoading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
            </button>
          </form>

          <p className="text-center text-sm text-white/40 mt-6">
            Đã có tài khoản?{" "}
            <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
