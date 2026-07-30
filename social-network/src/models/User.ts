// src/models/User.ts

import mongoose, { Schema, model, models, Document, Types } from "mongoose";

// ─────────────────────────────────────────────
// 1. INTERFACE — Khai báo "hình dạng" của User document trong TypeScript
//    Document: kiểu gốc của Mongoose, cung cấp _id, save(), v.v.
// ─────────────────────────────────────────────
export interface IUser extends Document {
  username: string;
  email: string;
  password: string;
  avatar: string;
  bio: string;
  followers: Types.ObjectId[];  // Mảng ID những người THEO DÕI mình
  following: Types.ObjectId[];  // Mảng ID những người MÌNH THEO DÕI
  createdAt: Date;
  updatedAt: Date;
}

// ─────────────────────────────────────────────
// 2. SCHEMA — Định nghĩa cấu trúc & ràng buộc dữ liệu trong MongoDB
// ─────────────────────────────────────────────
const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: [true, "Username là bắt buộc"],
      unique: true,       // Tạo unique index trong MongoDB
      trim: true,         // Tự động xóa khoảng trắng đầu/cuối
      minlength: [3, "Username phải có ít nhất 3 ký tự"],
      maxlength: [30, "Username tối đa 30 ký tự"],
    },
    email: {
      type: String,
      required: [true, "Email là bắt buộc"],
      unique: true,
      trim: true,
      lowercase: true,    // Tự động chuyển thành chữ thường khi lưu
    },
    password: {
      type: String,
      minlength: [6, "Password phải có ít nhất 6 ký tự"],
      // Không required — OAuth users (Google/GitHub) không có password
    },
    avatar: {
      type: String,
      default: "",
    },
    bio: {
      type: String,
      default: "",
      maxlength: [160, "Bio tối đa 160 ký tự"],
    },
    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",      // Tham chiếu tới chính Model "User" (self-reference)
      },
    ],
    following: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
  }
);

// ─────────────────────────────────────────────
// 3. EXPORT MODEL — Kỹ thuật quan trọng với Next.js!
//
//    `models.User` kiểm tra xem model "User" đã được compile chưa.
//    Nếu rồi → dùng lại (tránh lỗi "Cannot overwrite model" khi hot-reload)
//    Nếu chưa → tạo mới bằng model()
// ─────────────────────────────────────────────
const User = models.User || model<IUser>("User", UserSchema);

export default User;
