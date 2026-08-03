// src/models/Notification.ts
import mongoose, { Schema, model, models, Document, Types } from "mongoose";

export type NotificationType = "like" | "comment" | "follow";

export interface INotification extends Document {
  recipient: Types.ObjectId;   // Người nhận thông báo
  sender: Types.ObjectId;      // Người gửi hành động
  type: NotificationType;      // Loại: like / comment / follow
  post?: Types.ObjectId;       // Bài viết liên quan (nếu có)
  read: boolean;               // Đã đọc chưa
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipient: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["like", "comment", "follow"],
      required: true,
    },
    post: {
      type: Schema.Types.ObjectId,
      ref: "Post",
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Compound index để tránh tạo duplicate notification
NotificationSchema.index({ recipient: 1, sender: 1, type: 1, post: 1 }, { unique: false });

const Notification = models.Notification || model<INotification>("Notification", NotificationSchema);

export default Notification;
