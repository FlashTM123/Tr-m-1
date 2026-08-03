// src/types/notification.ts
// Shared types cho notification — dùng ở cả client và server

export interface NotificationData {
  _id: string;
  type: "like" | "comment" | "follow";
  read: boolean;
  createdAt: string;
  sender: {
    _id: string;
    username: string;
    avatar: string;
  };
  post?: {
    _id: string;
    content: string;
    images: string[];
  };
}
